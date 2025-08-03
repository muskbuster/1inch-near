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
const GAS_FOR_EVM_CALL: Gas = Gas::from_tgas(50);
const GAS_FOR_INTENTS_CALL: Gas = Gas::from_tgas(30);

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct EnhancedResolver {
    pub owner_id: AccountId,
    pub intents_vault_id: AccountId,
    pub solver_registry_id: AccountId,
    pub cross_chain_bridge_id: AccountId,
    
    // EVM cross-chain infrastructure (1inch integration)
    pub evm_escrow_factories: std::collections::HashMap<String, EvmEscrowFactoryInfo>,
    pub evm_resolvers: std::collections::HashMap<String, EvmResolverInfo>,
    
    // Cross-chain swap tracking
    pub evm_to_evm_swaps: std::collections::HashMap<String, EvmToEvmSwap>,
    pub near_intent_swaps: std::collections::HashMap<String, NearIntentSwap>,
    
    // Supported chains and their configurations
    pub supported_chains: std::collections::HashMap<String, ChainConfig>,
    pub next_swap_id: u64,
}

#[near]
impl EnhancedResolver {
    #[init]
    pub fn new(
        owner_id: AccountId,
        intents_vault_id: AccountId,
        solver_registry_id: AccountId,
        cross_chain_bridge_id: AccountId,
    ) -> Self {
        Self {
            owner_id,
            intents_vault_id,
            solver_registry_id,
            cross_chain_bridge_id,
            evm_escrow_factories: std::collections::HashMap::new(),
            evm_resolvers: std::collections::HashMap::new(),
            evm_to_evm_swaps: std::collections::HashMap::new(),
            near_intent_swaps: std::collections::HashMap::new(),
            supported_chains: std::collections::HashMap::new(),
            next_swap_id: 1,
        }
    }

    /// Execute EVM ↔ EVM swap through NEAR Intents
    pub fn execute_evm_to_evm_swap(
        &mut self,
        from_chain: String,
        to_chain: String,
        from_token: String,
        to_token: String,
        amount: u128,
        recipient: String,
        intent_data: String, // NEAR Intents data
    ) -> String {
        // Validate inputs
        assert!(amount > 0, "Amount must be greater than 0");
        assert!(
            self.supported_chains.contains_key(&from_chain),
            "Source chain not supported"
        );
        assert!(
            self.supported_chains.contains_key(&to_chain),
            "Destination chain not supported"
        );
        assert!(from_chain != to_chain, "Source and destination chains must be different");

        // Generate swap ID
        let swap_id = format!("evm_swap_{}", self.next_swap_id);
        self.next_swap_id += 1;

        // Create EVM to EVM swap
        let swap = EvmToEvmSwap {
            id: swap_id.clone(),
            from_chain: from_chain.clone(),
            to_chain: to_chain.clone(),
            from_token,
            to_token,
            amount,
            recipient: recipient.clone(),
            status: EvmSwapStatus::Pending,
            intent_data,
            created_at: env::block_timestamp(),
            completed_at: None,
        };

        // Store swap
        self.evm_to_evm_swaps.insert(swap_id.clone(), swap.clone());

        // Execute NEAR Intents for cross-chain coordination
        let _intents_promise = ext_intents::ext(self.intents_vault_id.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .with_static_gas(GAS_FOR_INTENTS_CALL)
            .execute_intent(
                swap.intent_data.clone(),
                Some(format!("EVM to EVM swap {}", swap_id)),
            );

        // Emit event
        EvmToEvmSwapInitiated {
            swap_id: swap_id.clone(),
            from_chain,
            to_chain,
            from_token: swap.from_token,
            to_token: swap.to_token,
            amount: swap.amount,
            recipient,
        }
        .emit();

        swap_id
    }

    /// Execute NEAR Intents-based swap (NEAR ↔ EVM or EVM ↔ NEAR)
    pub fn execute_near_intent_swap(
        &mut self,
        swap_type: NearIntentSwapType,
        source_chain: String,
        destination_chain: String,
        source_token: String,
        destination_token: String,
        amount: u128,
        recipient: String,
        intent_data: String,
    ) -> String {
        // Validate inputs
        assert!(amount > 0, "Amount must be greater than 0");
        assert!(
            self.supported_chains.contains_key(&source_chain),
            "Source chain not supported"
        );
        assert!(
            self.supported_chains.contains_key(&destination_chain),
            "Destination chain not supported"
        );

        // Generate swap ID
        let swap_id = format!("near_intent_swap_{}", self.next_swap_id);
        self.next_swap_id += 1;

        // Create NEAR Intents swap
        let swap = NearIntentSwap {
            id: swap_id.clone(),
            swap_type,
            source_chain: source_chain.clone(),
            destination_chain: destination_chain.clone(),
            source_token,
            destination_token,
            amount,
            recipient: recipient.clone(),
            status: NearIntentSwapStatus::Pending,
            intent_data,
            created_at: env::block_timestamp(),
            completed_at: None,
        };

        // Store swap
        self.near_intent_swaps.insert(swap_id.clone(), swap.clone());

        // Execute NEAR Intents
        let _intents_promise = ext_intents::ext(self.intents_vault_id.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .with_static_gas(GAS_FOR_INTENTS_CALL)
            .execute_intent(
                swap.intent_data.clone(),
                Some(format!("NEAR Intents swap {}", swap_id)),
            );

        // Emit event
        NearIntentSwapInitiated {
            swap_id: swap_id.clone(),
            swap_type: swap.swap_type,
            source_chain,
            destination_chain,
            source_token: swap.source_token,
            destination_token: swap.destination_token,
            amount: swap.amount,
            recipient,
        }
        .emit();

        swap_id
    }

    /// Complete EVM to EVM swap
    pub fn complete_evm_to_evm_swap(
        &mut self,
        swap_id: String,
        evm_tx_hash: String,
        proof_data: String, // Merkle proof or other verification data
    ) {
        let mut swap = self
            .evm_to_evm_swaps
            .get(&swap_id)
            .expect("Swap not found")
            .clone();

        assert!(swap.status == EvmSwapStatus::Pending, "Swap is not pending");

        // Verify the swap completion (this would integrate with 1inch's verification)
        assert!(
            self.verify_evm_swap_completion(&swap, &evm_tx_hash, &proof_data),
            "Invalid swap completion proof"
        );

        // Update swap status
        swap.status = EvmSwapStatus::Completed;
        swap.completed_at = Some(env::block_timestamp());

        // Store updated swap
        self.evm_to_evm_swaps.insert(swap_id.clone(), swap.clone());

        // Emit event
        EvmToEvmSwapCompleted {
            swap_id: swap_id.clone(),
            from_chain: swap.from_chain,
            to_chain: swap.to_chain,
            evm_tx_hash,
        }
        .emit();
    }

    /// Complete NEAR Intents swap
    pub fn complete_near_intent_swap(
        &mut self,
        swap_id: String,
        completion_data: String,
    ) {
        let mut swap = self
            .near_intent_swaps
            .get(&swap_id)
            .expect("Swap not found")
            .clone();

        assert!(swap.status == NearIntentSwapStatus::Pending, "Swap is not pending");

        // Update swap status
        swap.status = NearIntentSwapStatus::Completed;
        swap.completed_at = Some(env::block_timestamp());

        // Store updated swap
        self.near_intent_swaps.insert(swap_id.clone(), swap.clone());

        // Emit event
        NearIntentSwapCompleted {
            swap_id: swap_id.clone(),
            swap_type: swap.swap_type,
            completion_data,
        }
        .emit();
    }

    /// Add EVM escrow factory (for 1inch integration)
    pub fn add_evm_escrow_factory(
        &mut self,
        chain_id: String,
        factory_address: String,
        escrow_src_implementation: String,
        escrow_dst_implementation: String,
        is_active: bool,
    ) {
        assert!(
            env::predecessor_account_id() == self.owner_id,
            "Only owner can add EVM escrow factories"
        );

        let factory_info = EvmEscrowFactoryInfo {
            chain_id: chain_id.clone(),
            factory_address,
            escrow_src_implementation,
            escrow_dst_implementation,
            is_active,
        };

        self.evm_escrow_factories.insert(chain_id, factory_info);
    }

    /// Add EVM resolver (for 1inch integration)
    pub fn add_evm_resolver(
        &mut self,
        chain_id: String,
        resolver_address: String,
        resolver_type: EvmResolverType,
        is_active: bool,
    ) {
        assert!(
            env::predecessor_account_id() == self.owner_id,
            "Only owner can add EVM resolvers"
        );

        let resolver_info = EvmResolverInfo {
            chain_id: chain_id.clone(),
            resolver_address,
            resolver_type,
            is_active,
        };

        self.evm_resolvers.insert(chain_id, resolver_info);
    }

    /// Add supported chain configuration
    pub fn add_supported_chain(
        &mut self,
        chain_id: String,
        chain_name: String,
        chain_type: ChainType,
        rpc_url: String,
        is_active: bool,
    ) {
        assert!(
            env::predecessor_account_id() == self.owner_id,
            "Only owner can add supported chains"
        );

        let chain_config = ChainConfig {
            chain_id: chain_id.clone(),
            chain_name,
            chain_type,
            rpc_url,
            is_active,
        };

        self.supported_chains.insert(chain_id, chain_config);
    }

    /// Get EVM to EVM swap by ID
    pub fn get_evm_to_evm_swap(&self, swap_id: String) -> Option<EvmToEvmSwap> {
        self.evm_to_evm_swaps.get(&swap_id).cloned()
    }

    /// Get NEAR Intents swap by ID
    pub fn get_near_intent_swap(&self, swap_id: String) -> Option<NearIntentSwap> {
        self.near_intent_swaps.get(&swap_id).cloned()
    }

    /// Get EVM escrow factory for a chain
    pub fn get_evm_escrow_factory(&self, chain_id: String) -> Option<EvmEscrowFactoryInfo> {
        self.evm_escrow_factories.get(&chain_id).cloned()
    }

    /// Get EVM resolver for a chain
    pub fn get_evm_resolver(&self, chain_id: String) -> Option<EvmResolverInfo> {
        self.evm_resolvers.get(&chain_id).cloned()
    }

    /// Get supported chains
    pub fn get_supported_chains(&self) -> Vec<ChainConfig> {
        self.supported_chains.values().cloned().collect()
    }

    /// Verify EVM swap completion (integrates with 1inch's verification)
    fn verify_evm_swap_completion(
        &self,
        _swap: &EvmToEvmSwap,
        evm_tx_hash: &str,
        proof_data: &str,
    ) -> bool {
        // This would integrate with 1inch's verification system
        // For now, we'll do basic validation
        !evm_tx_hash.is_empty() && !proof_data.is_empty()
    }

    /// Call EVM escrow factory (for 1inch integration)
    pub fn call_evm_escrow_factory(
        &self,
        chain_id: String,
        method: String,
        args: String,
    ) -> Promise {
        // This would call the EVM escrow factory contract
        // For now, we'll just emit an event
        EvmEscrowFactoryCall {
            chain_id,
            method,
            args,
            timestamp: env::block_timestamp(),
        }
        .emit();

        Promise::new(env::current_account_id())
    }

    /// Call EVM resolver (for 1inch integration)
    pub fn call_evm_resolver(
        &self,
        chain_id: String,
        method: String,
        args: String,
    ) -> Promise {
        // This would call the EVM resolver contract
        // For now, we'll just emit an event
        EvmResolverCall {
            chain_id,
            method,
            args,
            timestamp: env::block_timestamp(),
        }
        .emit();

        Promise::new(env::current_account_id())
    }
} 