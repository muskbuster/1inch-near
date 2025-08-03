use near_sdk::{
    borsh::{BorshDeserialize, BorshSerialize},
    env, near, AccountId, Gas, NearToken, PanicOnDefault, Promise, Timestamp,
    serde::{Deserialize, Serialize},
};

mod events;
mod ext;
mod types;

use events::*;
use ext::*;
use types::*;

// Gas constants
const GAS_FOR_FT_TRANSFER: Gas = Gas::from_tgas(10);
const GAS_FOR_CROSS_CHAIN_CALL: Gas = Gas::from_tgas(50);

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct CrossChainBridge {
    pub owner_id: AccountId,
    pub evm_bridge_address: String, // EVM bridge contract address
    pub supported_evm_chains: std::collections::HashMap<String, EvmChainInfo>,
    pub pending_swaps: std::collections::HashMap<String, CrossChainSwap>,
    pub completed_swaps: std::collections::HashMap<String, CrossChainSwap>,
    pub next_swap_id: u64,
}

#[near]
impl CrossChainBridge {
    #[init]
    pub fn new(owner_id: AccountId, evm_bridge_address: String) -> Self {
        Self {
            owner_id,
            evm_bridge_address,
            supported_evm_chains: std::collections::HashMap::new(),
            pending_swaps: std::collections::HashMap::new(),
            completed_swaps: std::collections::HashMap::new(),
            next_swap_id: 1,
        }
    }

    /// Initialize a cross-chain swap from NEAR to EVM
    pub fn initiate_near_to_evm_swap(
        &mut self,
        evm_chain_id: String,
        near_token: AccountId,
        evm_token: String, // EVM token address
        amount: u128,
        recipient: String, // EVM address
        timelock_duration: u64,
    ) -> String {
        // Validate inputs
        assert!(amount > 0, "Amount must be greater than 0");
        assert!(
            self.supported_evm_chains.contains_key(&evm_chain_id),
            "EVM chain not supported"
        );
        assert!(
            env::predecessor_account_id() != env::current_account_id(),
            "Cannot swap with self"
        );

        // Generate swap ID
        let swap_id = format!("swap_{}", self.next_swap_id);
        self.next_swap_id += 1;

        // Create cross-chain swap
        let swap = CrossChainSwap {
            id: swap_id.clone(),
            direction: SwapDirection::NearToEvm,
            evm_chain_id: evm_chain_id.clone(),
            near_token,
            evm_token,
            amount,
            sender: env::predecessor_account_id(),
            recipient,
            status: SwapStatus::Pending,
            secret_hash: None, // For NEAR to EVM swaps, no secret hash needed initially
            timelock_duration,
            created_at: env::block_timestamp(),
            completed_at: None,
        };

        // Store swap
        self.pending_swaps.insert(swap_id.clone(), swap.clone());

        // Emit event
        CrossChainSwapInitiated {
            swap_id: swap_id.clone(),
            direction: swap.direction,
            evm_chain_id,
            near_token: swap.near_token,
            evm_token: swap.evm_token,
            amount: swap.amount,
            sender: swap.sender,
            recipient: swap.recipient,
        }
        .emit();

        swap_id
    }

    /// Complete a cross-chain swap from EVM to NEAR
    pub fn complete_evm_to_near_swap(
        &mut self,
        swap_id: String,
        secret: String,
        evm_tx_hash: String,
    ) -> Promise {
        // Validate swap exists and is pending
        let mut swap = self
            .pending_swaps
            .get(&swap_id)
            .expect("Swap not found")
            .clone();

        assert!(swap.status == SwapStatus::Pending, "Swap is not pending");
        assert!(
            swap.direction == SwapDirection::EvmToNear,
            "Invalid swap direction"
        );

        // Verify secret hash matches
        let expected_hash = self.generate_secret_hash(&secret);
        assert!(
            swap.secret_hash.as_ref() == Some(&expected_hash),
            "Invalid secret"
        );

        // Update swap status
        swap.status = SwapStatus::Completed;
        swap.completed_at = Some(env::block_timestamp());

        // Move from pending to completed
        self.pending_swaps.remove(&swap_id);
        self.completed_swaps.insert(swap_id.clone(), swap.clone());

        // Transfer tokens to recipient
        let transfer_promise = ext_ft::ext(swap.near_token.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .with_static_gas(GAS_FOR_FT_TRANSFER)
            .ft_transfer(
                swap.recipient.parse().unwrap(),
                swap.amount.to_string(),
                Some(format!("Complete cross-chain swap {}", swap_id)),
            );

        // Emit event
        CrossChainSwapCompleted {
            swap_id: swap_id.clone(),
            direction: swap.direction,
            evm_tx_hash,
            secret,
        }
        .emit();

        transfer_promise
    }

    /// Cancel a cross-chain swap (after timelock)
    pub fn cancel_swap(&mut self, swap_id: String) {
        let mut swap = self
            .pending_swaps
            .get(&swap_id)
            .expect("Swap not found")
            .clone();

        // Check if timelock has expired
        let timelock_expiry = swap.created_at + swap.timelock_duration;
        assert!(
            env::block_timestamp() >= timelock_expiry,
            "Timelock not expired"
        );

        // Update swap status
        swap.status = SwapStatus::Cancelled;
        swap.completed_at = Some(env::block_timestamp());

        // Move from pending to completed
        self.pending_swaps.remove(&swap_id);
        self.completed_swaps.insert(swap_id.clone(), swap.clone());

        // Emit event
        CrossChainSwapCancelled {
            swap_id: swap_id.clone(),
            direction: swap.direction,
        }
        .emit();
    }

    /// Add supported EVM chain
    pub fn add_evm_chain(
        &mut self,
        chain_id: String,
        chain_name: String,
        bridge_address: String,
        is_active: bool,
    ) {
        assert!(
            env::predecessor_account_id() == self.owner_id,
            "Only owner can add EVM chains"
        );

        let chain_info = EvmChainInfo {
            chain_id: chain_id.clone(),
            chain_name,
            bridge_address,
            is_active,
        };

        self.supported_evm_chains.insert(chain_id, chain_info);
    }

    /// Get swap by ID
    pub fn get_swap(&self, swap_id: String) -> Option<CrossChainSwap> {
        self.pending_swaps
            .get(&swap_id)
            .cloned()
            .or_else(|| self.completed_swaps.get(&swap_id).cloned())
    }

    /// Get pending swaps by sender
    pub fn get_pending_swaps_by_sender(&self, sender: AccountId) -> Vec<CrossChainSwap> {
        self.pending_swaps
            .values()
            .filter(|swap| swap.sender == sender)
            .cloned()
            .collect()
    }

    /// Get supported EVM chains
    pub fn get_supported_evm_chains(&self) -> Vec<EvmChainInfo> {
        self.supported_evm_chains.values().cloned().collect()
    }

    /// Generate secret hash for cross-chain verification
    pub fn generate_secret_hash(&self, secret: &str) -> String {
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(secret.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    /// Call EVM bridge contract (for integration with 1inch)
    pub fn call_evm_bridge(&self, method: String, args: String) -> Promise {
        // This would integrate with the EVM bridge contract
        // For now, we'll just emit an event
        EvmBridgeCall {
            method,
            args,
            timestamp: env::block_timestamp(),
        }
        .emit();

        Promise::new(env::current_account_id())
    }
} 