use near_sdk::{
    serde::{Deserialize, Serialize},
    AccountId, Timestamp,
};

use crate::types::{EvmSwapStatus, NearIntentSwapStatus, NearIntentSwapType, EvmResolverType};

#[derive(Serialize, Deserialize)]
pub struct EvmToEvmSwapInitiated {
    pub swap_id: String,
    pub from_chain: String,
    pub to_chain: String,
    pub from_token: String,
    pub to_token: String,
    pub amount: u128,
    pub recipient: String,
}

#[derive(Serialize, Deserialize)]
pub struct EvmToEvmSwapCompleted {
    pub swap_id: String,
    pub from_chain: String,
    pub to_chain: String,
    pub evm_tx_hash: String,
}

#[derive(Serialize, Deserialize)]
pub struct NearIntentSwapInitiated {
    pub swap_id: String,
    pub swap_type: NearIntentSwapType,
    pub source_chain: String,
    pub destination_chain: String,
    pub source_token: String,
    pub destination_token: String,
    pub amount: u128,
    pub recipient: String,
}

#[derive(Serialize, Deserialize)]
pub struct NearIntentSwapCompleted {
    pub swap_id: String,
    pub swap_type: NearIntentSwapType,
    pub completion_data: String,
}

#[derive(Serialize, Deserialize)]
pub struct EvmEscrowFactoryCall {
    pub chain_id: String,
    pub method: String,
    pub args: String,
    pub timestamp: Timestamp,
}

#[derive(Serialize, Deserialize)]
pub struct EvmResolverCall {
    pub chain_id: String,
    pub method: String,
    pub args: String,
    pub timestamp: Timestamp,
}

#[derive(Serialize, Deserialize)]
pub struct EvmEscrowFactoryAdded {
    pub chain_id: String,
    pub factory_address: String,
    pub escrow_src_implementation: String,
    pub escrow_dst_implementation: String,
}

#[derive(Serialize, Deserialize)]
pub struct EvmResolverAdded {
    pub chain_id: String,
    pub resolver_address: String,
    pub resolver_type: EvmResolverType,
}

#[derive(Serialize, Deserialize)]
pub struct ChainAdded {
    pub chain_id: String,
    pub chain_name: String,
    pub chain_type: String,
    pub rpc_url: String,
}

pub trait Event {
    fn emit(self);
}

impl Event for EvmToEvmSwapInitiated {
    fn emit(self) {
        near_sdk::env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"1inch-enhanced-resolver\",\"version\":\"1.0.0\",\"event\":\"evm_to_evm_swap_initiated\",\"data\":{}}}",
            serde_json::to_string(&self).unwrap()
        ));
    }
}

impl Event for EvmToEvmSwapCompleted {
    fn emit(self) {
        near_sdk::env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"1inch-enhanced-resolver\",\"version\":\"1.0.0\",\"event\":\"evm_to_evm_swap_completed\",\"data\":{}}}",
            serde_json::to_string(&self).unwrap()
        ));
    }
}

impl Event for NearIntentSwapInitiated {
    fn emit(self) {
        near_sdk::env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"1inch-enhanced-resolver\",\"version\":\"1.0.0\",\"event\":\"near_intent_swap_initiated\",\"data\":{}}}",
            serde_json::to_string(&self).unwrap()
        ));
    }
}

impl Event for NearIntentSwapCompleted {
    fn emit(self) {
        near_sdk::env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"1inch-enhanced-resolver\",\"version\":\"1.0.0\",\"event\":\"near_intent_swap_completed\",\"data\":{}}}",
            serde_json::to_string(&self).unwrap()
        ));
    }
}

impl Event for EvmEscrowFactoryCall {
    fn emit(self) {
        near_sdk::env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"1inch-enhanced-resolver\",\"version\":\"1.0.0\",\"event\":\"evm_escrow_factory_call\",\"data\":{}}}",
            serde_json::to_string(&self).unwrap()
        ));
    }
}

impl Event for EvmResolverCall {
    fn emit(self) {
        near_sdk::env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"1inch-enhanced-resolver\",\"version\":\"1.0.0\",\"event\":\"evm_resolver_call\",\"data\":{}}}",
            serde_json::to_string(&self).unwrap()
        ));
    }
}

impl Event for EvmEscrowFactoryAdded {
    fn emit(self) {
        near_sdk::env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"1inch-enhanced-resolver\",\"version\":\"1.0.0\",\"event\":\"evm_escrow_factory_added\",\"data\":{}}}",
            serde_json::to_string(&self).unwrap()
        ));
    }
}

impl Event for EvmResolverAdded {
    fn emit(self) {
        near_sdk::env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"1inch-enhanced-resolver\",\"version\":\"1.0.0\",\"event\":\"evm_resolver_added\",\"data\":{}}}",
            serde_json::to_string(&self).unwrap()
        ));
    }
}

impl Event for ChainAdded {
    fn emit(self) {
        near_sdk::env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"1inch-enhanced-resolver\",\"version\":\"1.0.0\",\"event\":\"chain_added\",\"data\":{}}}",
            serde_json::to_string(&self).unwrap()
        ));
    }
} 