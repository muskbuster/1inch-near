use near_sdk::{
    borsh::{BorshDeserialize, BorshSerialize},
    env, near_bindgen, AccountId, Gas, NearToken, PanicOnDefault, Promise, Timestamp,
};

mod events;
mod ext;
mod escrow;
mod types;
mod timelocks;

use events::*;
use ext::*;
use types::*;
use timelocks::*;

// Gas constants
const GAS_FOR_FT_TRANSFER: Gas = Gas::from_tgas(10);
const GAS_FOR_FT_TRANSFER_CALLBACK: Gas = Gas::from_tgas(10);

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    owner_id: AccountId,
    intents_contract_id: AccountId,
    limit_order_protocol_id: AccountId,
    escrows: std::collections::HashMap<String, Escrow>,
    escrow_by_maker: std::collections::HashMap<AccountId, Vec<String>>,
    escrow_by_taker: std::collections::HashMap<AccountId, Vec<String>>,
    paused: bool,
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

    /// Create a new cross-chain escrow
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

        let escrow = Escrow {
            maker_asset,
            taker_asset,
            making_amount,
            taking_amount,
            maker: maker.clone(),
            taker: taker.clone(),
            source_chain,
            destination_chain,
            timelocks,
            safety_deposit,
            secret_hash: None,
            secret: None,
            status: EscrowStatus::Created,
            created_at: env::block_timestamp(),
        };

        self.escrows.insert(escrow_id.clone(), escrow.clone());
        
        // Track escrows by maker and taker
        self.escrow_by_maker
            .entry(maker.clone())
            .or_insert_with(Vec::new)
            .push(escrow_id.clone());
        
        self.escrow_by_taker
            .entry(taker.clone())
            .or_insert_with(Vec::new)
            .push(escrow_id.clone());

        Event::EscrowCreated {
            escrow_id: &escrow_id,
            maker: &maker,
            taker: &taker,
            maker_asset: &escrow.maker_asset,
            taker_asset: &escrow.taker_asset,
            making_amount: &escrow.making_amount,
            taking_amount: &escrow.taking_amount,
        }
        .emit();

        escrow_id
    }

    /// Deposit funds into escrow (source chain)
    #[payable]
    pub fn deposit_into_escrow(
        &mut self,
        escrow_id: String,
        secret_hash: String,
    ) -> Promise {
        require!(!self.paused, "Contract is paused");
        assert_one_yocto();

        let escrow = self.escrows.get_mut(&escrow_id).expect("Escrow not found");
        require!(escrow.status == EscrowStatus::Created, "Escrow not in created state");
        require!(
            env::predecessor_account_id() == escrow.maker,
            "Only maker can deposit"
        );

        escrow.secret_hash = Some(secret_hash.clone());
        escrow.status = EscrowStatus::Funded;

        // Transfer tokens to NEAR Intents
        ext_intents::ext(self.intents_contract_id.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .deposit(
                escrow.maker_asset.clone(),
                escrow.making_amount,
                env::current_account_id(),
            )
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(GAS_FOR_ESCROW_CALLBACK)
                    .on_escrow_deposited(escrow_id, secret_hash),
            )
    }

    #[private]
    pub fn on_escrow_deposited(
        &mut self,
        escrow_id: String,
        secret_hash: String,
    ) {
        Event::EscrowFunded {
            escrow_id: &escrow_id,
            secret_hash: &secret_hash,
        }
        .emit();
    }

    /// Withdraw funds from escrow using secret
    #[payable]
    pub fn withdraw_from_escrow(
        &mut self,
        escrow_id: String,
        secret: String,
        receiver: Option<AccountId>,
    ) -> Promise {
        require!(!self.paused, "Contract is paused");
        assert_one_yocto();

        let escrow = self.escrows.get_mut(&escrow_id).expect("Escrow not found");
        require!(escrow.status == EscrowStatus::Funded, "Escrow not funded");
        
        // Verify secret matches hash
        let secret_hash = escrow.secret_hash.as_ref().expect("No secret hash");
        require!(
            self.verify_secret(&secret, secret_hash),
            "Invalid secret"
        );

        // Check timelocks
        let timelocks = &escrow.timelocks;
        require!(
            timelocks.is_withdrawal_period(env::block_timestamp()),
            "Not in withdrawal period"
        );

        escrow.secret = Some(secret.clone());
        escrow.status = EscrowStatus::Withdrawn;

        let receiver_id = receiver.unwrap_or_else(|| env::predecessor_account_id());

        // Withdraw from NEAR Intents
        ext_intents::ext(self.intents_contract_id.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .withdraw(
                escrow.maker_asset.clone(),
                escrow.making_amount,
                receiver_id.clone(),
            )
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(GAS_FOR_ESCROW_CALLBACK)
                    .on_escrow_withdrawn(escrow_id, secret, receiver_id),
            )
    }

    #[private]
    pub fn on_escrow_withdrawn(
        &mut self,
        escrow_id: String,
        secret: String,
        receiver_id: AccountId,
    ) {
        Event::EscrowWithdrawn {
            escrow_id: &escrow_id,
            secret: &secret,
            receiver: &receiver_id,
        }
        .emit();
    }

    /// Cancel escrow (after timelock period)
    #[payable]
    pub fn cancel_escrow(&mut self, escrow_id: String) -> Promise {
        require!(!self.paused, "Contract is paused");
        assert_one_yocto();

        let escrow = self.escrows.get_mut(&escrow_id).expect("Escrow not found");
        require!(escrow.status == EscrowStatus::Funded, "Escrow not funded");
        
        // Check timelocks
        let timelocks = &escrow.timelocks;
        require!(
            timelocks.is_cancellation_period(env::block_timestamp()),
            "Not in cancellation period"
        );

        escrow.status = EscrowStatus::Cancelled;

        // Return funds to maker
        ext_intents::ext(self.intents_contract_id.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .withdraw(
                escrow.maker_asset.clone(),
                escrow.making_amount,
                escrow.maker.clone(),
            )
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(GAS_FOR_ESCROW_CALLBACK)
                    .on_escrow_cancelled(escrow_id),
            )
    }

    #[private]
    pub fn on_escrow_cancelled(&mut self, escrow_id: String) {
        Event::EscrowCancelled {
            escrow_id: &escrow_id,
        }
        .emit();
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
        Event::ContractPaused {}.emit();
    }

    /// Unpause the contract (owner only)
    pub fn unpause(&mut self) {
        require!(
            env::predecessor_account_id() == self.owner_id,
            "Only owner can unpause"
        );
        self.paused = false;
        Event::ContractUnpaused {}.emit();
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
        format!("{:x}", md::compute(data.as_bytes()))
    }

    fn verify_secret(&self, secret: &str, secret_hash: &str) -> bool {
        let computed_hash = format!("{:x}", md::compute(secret.as_bytes()));
        computed_hash == *secret_hash
    }
} 