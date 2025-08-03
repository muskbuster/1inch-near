use near_sdk::{
    borsh::{BorshDeserialize, BorshSerialize},
    env, near, AccountId, Gas, NearToken, PanicOnDefault, Promise, Timestamp,
    serde::{Deserialize, Serialize},
    ext_contract, require, assert_one_yocto,
};

mod events;
mod ext;
mod types;
mod timelocks;

use events::*;
use types::*;
use timelocks::*;

// Gas constants
const GAS_FOR_FT_TRANSFER: Gas = Gas::from_tgas(10);
const GAS_FOR_INTENTS_CALL: Gas = Gas::from_tgas(30);
const GAS_FOR_ESCROW_CALLBACK: Gas = Gas::from_tgas(20);

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    pub owner_id: AccountId,
    pub intents_contract_id: AccountId,
    pub limit_order_protocol_id: AccountId,
    pub escrows: std::collections::HashMap<String, Escrow>,
    pub escrow_by_maker: std::collections::HashMap<AccountId, Vec<String>>,
    pub escrow_by_taker: std::collections::HashMap<AccountId, Vec<String>>,
    pub paused: bool,
}

#[ext_contract(ext_ft)]
trait FungibleToken {
    fn ft_transfer(&mut self, receiver_id: AccountId, amount: u128, memo: Option<String>);
    fn ft_transfer_call(
        &mut self,
        receiver_id: AccountId,
        amount: u128,
        msg: String,
    ) -> Promise;
}

#[ext_contract(ext_intents)]
trait IntentsContract {
    fn deposit(token_id: AccountId, amount: u128, receiver_id: AccountId);
    fn withdraw(token_id: AccountId, amount: u128, receiver_id: AccountId);
}

#[near]
impl Contract {
    #[init]
    pub fn new(
        owner_id: AccountId,
        intents_contract_id: AccountId,
        limit_order_protocol_id: AccountId,
    ) -> Self {
        Self {
            owner_id,
            intents_contract_id,
            limit_order_protocol_id,
            escrows: std::collections::HashMap::new(),
            escrow_by_maker: std::collections::HashMap::new(),
            escrow_by_taker: std::collections::HashMap::new(),
            paused: false,
        }
    }

    /// Create a new escrow
    #[payable]
    pub fn create_escrow(
        &mut self,
        maker_asset: AccountId,
        taker_asset: AccountId,
        making_amount: u128,
        taking_amount: u128,
        maker: AccountId,
        taker: AccountId,
        source_chain: String,
        destination_chain: String,
        timelocks: Timelocks,
        safety_deposit: u128,
    ) -> String {
        require!(!self.paused, "Contract is paused");
        require!(making_amount > 0, "Making amount must be greater than 0");
        require!(taking_amount > 0, "Taking amount must be greater than 0");
        require!(maker_asset != taker_asset, "Maker and taker assets must be different");

        // Generate escrow ID
        let escrow_id = self.generate_escrow_id(
            &maker_asset,
            &taker_asset,
            making_amount,
            taking_amount,
            &maker,
            &taker,
            &source_chain,
            &destination_chain,
        );

        require!(!self.escrows.contains_key(&escrow_id), "Escrow already exists");

        // Create escrow
        let escrow = Escrow {
            id: escrow_id.clone(),
            maker,
            taker,
            maker_asset,
            taker_asset,
            making_amount,
            taking_amount,
            secret_hash: String::new(), // Will be set when funded
            timelocks,
            status: EscrowStatus::Created,
            created_at: env::block_timestamp(),
            funded_at: None,
        };

        // Store escrow
        self.escrows.insert(escrow_id.clone(), escrow.clone());

        // Add to maker's escrows
        self.escrow_by_maker
            .entry(escrow.maker.clone())
            .or_insert_with(Vec::new)
            .push(escrow_id.clone());

        // Add to taker's escrows
        self.escrow_by_taker
            .entry(escrow.taker.clone())
            .or_insert_with(Vec::new)
            .push(escrow_id.clone());

        // Emit event
        EscrowCreated {
            escrow_id: escrow_id.clone(),
            maker: escrow.maker,
            taker: escrow.taker,
            maker_asset: escrow.maker_asset,
            taker_asset: escrow.taker_asset,
            making_amount: escrow.making_amount,
            taking_amount: escrow.taking_amount,
        }
        .emit();

        escrow_id
    }

    /// Deposit funds into escrow
    #[payable]
    pub fn deposit_into_escrow(
        &mut self,
        escrow_id: String,
        secret_hash: String,
    ) -> Promise {
        assert_one_yocto();
        require!(!self.paused, "Contract is paused");

        let mut escrow = self
            .escrows
            .get(&escrow_id)
            .expect("Escrow not found")
            .clone();

        require!(escrow.status == EscrowStatus::Created, "Escrow not in created state");
        require!(
            env::predecessor_account_id() == escrow.taker,
            "Only taker can deposit"
        );

        // Update escrow
        escrow.status = EscrowStatus::Funded;
        escrow.secret_hash = secret_hash.clone();
        escrow.funded_at = Some(env::block_timestamp());

        // Store updated escrow
        self.escrows.insert(escrow_id.clone(), escrow.clone());

        // Call intents contract to deposit funds
        let deposit_promise = ext_intents::ext(self.intents_contract_id.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .with_static_gas(GAS_FOR_ESCROW_CALLBACK)
            .deposit(
                escrow.taker_asset.clone(),
                escrow.taking_amount,
                env::current_account_id(),
            );

        // Emit event
        EscrowFunded {
            escrow_id: escrow_id.clone(),
            taker: escrow.taker,
            secret_hash,
        }
        .emit();

        deposit_promise
    }

    /// Callback after deposit
    #[private]
    pub fn on_escrow_deposited(
        &mut self,
        escrow_id: String,
        secret_hash: String,
    ) {
        // Escrow is now funded and ready for withdrawal
    }

    /// Withdraw from escrow
    #[payable]
    pub fn withdraw_from_escrow(
        &mut self,
        escrow_id: String,
        secret: String,
        receiver: Option<AccountId>,
    ) -> Promise {
        assert_one_yocto();
        require!(!self.paused, "Contract is paused");

        let mut escrow = self
            .escrows
            .get(&escrow_id)
            .expect("Escrow not found")
            .clone();

        require!(escrow.status == EscrowStatus::Funded, "Escrow not funded");
        require!(
            self.verify_secret(&secret, &escrow.secret_hash),
            "Invalid secret"
        );

        // Check if withdrawal period has started
        let current_stage = escrow.timelocks.get_current_stage(escrow.created_at);
        require!(
            matches!(current_stage, TimelockStage::Withdrawal | TimelockStage::PublicWithdrawal),
            "Not in withdrawal period"
        );

        // Update escrow
        escrow.status = EscrowStatus::Withdrawn;

        // Store updated escrow
        self.escrows.insert(escrow_id.clone(), escrow.clone());

        let receiver_id = receiver.unwrap_or_else(|| env::predecessor_account_id());

        // Transfer funds to receiver
        let transfer_promise = ext_ft::ext(escrow.maker_asset.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .with_static_gas(GAS_FOR_FT_TRANSFER)
            .ft_transfer(
                receiver_id.clone(),
                escrow.making_amount,
                Some(format!("Withdraw from escrow {}", escrow_id)),
            );

        // Emit event
        EscrowWithdrawn {
            escrow_id: escrow_id.clone(),
            receiver: receiver_id,
            secret,
        }
        .emit();

        transfer_promise
    }

    /// Callback after withdrawal
    #[private]
    pub fn on_escrow_withdrawn(
        &mut self,
        escrow_id: String,
        secret: String,
        receiver_id: AccountId,
    ) {
        // Escrow has been successfully withdrawn
    }

    /// Cancel escrow
    #[payable]
    pub fn cancel_escrow(&mut self, escrow_id: String) -> Promise {
        assert_one_yocto();
        require!(!self.paused, "Contract is paused");

        let mut escrow = self
            .escrows
            .get(&escrow_id)
            .expect("Escrow not found")
            .clone();

        require!(escrow.status == EscrowStatus::Funded, "Escrow not funded");

        // Check if cancellation period has started
        let current_stage = escrow.timelocks.get_current_stage(escrow.created_at);
        require!(
            matches!(current_stage, TimelockStage::Cancellation | TimelockStage::PublicCancellation),
            "Not in cancellation period"
        );

        // Update escrow
        escrow.status = EscrowStatus::Cancelled;

        // Store updated escrow
        self.escrows.insert(escrow_id.clone(), escrow.clone());

        // Return funds to taker
        let transfer_promise = ext_ft::ext(escrow.taker_asset.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .with_static_gas(GAS_FOR_FT_TRANSFER)
            .ft_transfer(
                escrow.taker.clone(),
                escrow.taking_amount,
                Some(format!("Cancel escrow {}", escrow_id)),
            );

        // Emit event
        EscrowCancelled {
            escrow_id: escrow_id.clone(),
            taker: escrow.taker,
        }
        .emit();

        transfer_promise
    }

    /// Callback after cancellation
    #[private]
    pub fn on_escrow_cancelled(&mut self, escrow_id: String) {
        // Escrow has been successfully cancelled
    }

    /// Get escrow by ID
    pub fn get_escrow(&self, escrow_id: String) -> Option<Escrow> {
        self.escrows.get(&escrow_id).cloned()
    }

    /// Get escrows by maker
    pub fn get_escrows_by_maker(&self, maker: AccountId) -> Vec<Escrow> {
        self.escrow_by_maker
            .get(&maker)
            .map(|escrow_ids| {
                escrow_ids
                    .iter()
                    .filter_map(|id| self.escrows.get(id).cloned())
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Get escrows by taker
    pub fn get_escrows_by_taker(&self, taker: AccountId) -> Vec<Escrow> {
        self.escrow_by_taker
            .get(&taker)
            .map(|escrow_ids| {
                escrow_ids
                    .iter()
                    .filter_map(|id| self.escrows.get(id).cloned())
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Pause the contract (owner only)
    pub fn pause(&mut self) {
        require!(
            env::predecessor_account_id() == self.owner_id,
            "Only owner can pause"
        );
        self.paused = true;
        ContractPaused {}.emit();
    }

    /// Unpause the contract (owner only)
    pub fn unpause(&mut self) {
        require!(
            env::predecessor_account_id() == self.owner_id,
            "Only owner can unpause"
        );
        self.paused = false;
        ContractUnpaused {}.emit();
    }
}

impl Contract {
    fn generate_escrow_id(
        &self,
        maker_asset: &AccountId,
        taker_asset: &AccountId,
        making_amount: u128,
        taking_amount: u128,
        maker: &AccountId,
        taker: &AccountId,
        source_chain: &str,
        destination_chain: &str,
    ) -> String {
        let data = format!(
            "{}:{}:{}:{}:{}:{}:{}:{}",
            maker_asset, taker_asset, making_amount, taking_amount, maker, taker, source_chain, destination_chain
        );
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(data.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    fn verify_secret(&self, secret: &str, secret_hash: &str) -> bool {
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(secret.as_bytes());
        let computed_hash = format!("{:x}", hasher.finalize());
        computed_hash == *secret_hash
    }

    /// Generate a hash for escrow verification
    pub fn hash_escrow_data(&self, data: String) -> String {
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(data.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    /// Generate a hash for secret verification
    pub fn hash_secret(&self, secret: String) -> String {
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(secret.as_bytes());
        format!("{:x}", hasher.finalize())
    }
} 