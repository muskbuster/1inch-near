use near_sdk::{
    serde::{Deserialize, Serialize},
    AccountId, Timestamp,
};

use crate::types::{SwapDirection, SwapStatus};

#[derive(Serialize, Deserialize)]
pub struct CrossChainSwapInitiated {
    pub swap_id: String,
    pub direction: SwapDirection,
    pub evm_chain_id: String,
    pub near_token: AccountId,
    pub evm_token: String,
    pub amount: u128,
    pub sender: AccountId,
    pub recipient: String,
}

#[derive(Serialize, Deserialize)]
pub struct CrossChainSwapCompleted {
    pub swap_id: String,
    pub direction: SwapDirection,
    pub evm_tx_hash: String,
    pub secret: String,
}

#[derive(Serialize, Deserialize)]
pub struct CrossChainSwapCancelled {
    pub swap_id: String,
    pub direction: SwapDirection,
}

#[derive(Serialize, Deserialize)]
pub struct EvmBridgeCall {
    pub method: String,
    pub args: String,
    pub timestamp: Timestamp,
}

#[derive(Serialize, Deserialize)]
pub struct EvmChainAdded {
    pub chain_id: String,
    pub chain_name: String,
    pub bridge_address: String,
}

pub trait Event {
    fn emit(self);
}

impl Event for CrossChainSwapInitiated {
    fn emit(self) {
        near_sdk::env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"1inch-cross-chain\",\"version\":\"1.0.0\",\"event\":\"swap_initiated\",\"data\":{}}}",
            serde_json::to_string(&self).unwrap()
        ));
    }
}

impl Event for CrossChainSwapCompleted {
    fn emit(self) {
        near_sdk::env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"1inch-cross-chain\",\"version\":\"1.0.0\",\"event\":\"swap_completed\",\"data\":{}}}",
            serde_json::to_string(&self).unwrap()
        ));
    }
}

impl Event for CrossChainSwapCancelled {
    fn emit(self) {
        near_sdk::env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"1inch-cross-chain\",\"version\":\"1.0.0\",\"event\":\"swap_cancelled\",\"data\":{}}}",
            serde_json::to_string(&self).unwrap()
        ));
    }
}

impl Event for EvmBridgeCall {
    fn emit(self) {
        near_sdk::env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"1inch-cross-chain\",\"version\":\"1.0.0\",\"event\":\"evm_bridge_call\",\"data\":{}}}",
            serde_json::to_string(&self).unwrap()
        ));
    }
}

impl Event for EvmChainAdded {
    fn emit(self) {
        near_sdk::env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"1inch-cross-chain\",\"version\":\"1.0.0\",\"event\":\"evm_chain_added\",\"data\":{}}}",
            serde_json::to_string(&self).unwrap()
        ));
    }
} 