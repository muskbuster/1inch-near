use near_sdk::{
    borsh::{BorshDeserialize, BorshSerialize},
    serde::{Deserialize, Serialize},
    AccountId, Timestamp,
};

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum SwapDirection {
    NearToEvm,
    EvmToNear,
}

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum SwapStatus {
    Pending,
    Completed,
    Cancelled,
    Failed,
}

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Serialize, Deserialize)]
pub struct CrossChainSwap {
    pub id: String,
    pub direction: SwapDirection,
    pub evm_chain_id: String,
    pub near_token: AccountId,
    pub evm_token: String, // EVM token address
    pub amount: u128,
    pub sender: AccountId,
    pub recipient: String, // EVM address or NEAR account
    pub status: SwapStatus,
    pub secret_hash: Option<String>, // For EVM to NEAR swaps
    pub timelock_duration: u64,
    pub created_at: Timestamp,
    pub completed_at: Option<Timestamp>,
}

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Serialize, Deserialize)]
pub struct EvmChainInfo {
    pub chain_id: String,
    pub chain_name: String,
    pub bridge_address: String,
    pub is_active: bool,
}

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Serialize, Deserialize)]
pub struct CrossChainSwapInfo {
    pub id: String,
    pub direction: SwapDirection,
    pub evm_chain_id: String,
    pub near_token: AccountId,
    pub evm_token: String,
    pub amount: u128,
    pub sender: AccountId,
    pub recipient: String,
    pub status: SwapStatus,
    pub timelock_duration: u64,
    pub created_at: Timestamp,
    pub completed_at: Option<Timestamp>,
}

impl CrossChainSwap {
    pub fn is_expired(&self) -> bool {
        let expiry_time = self.created_at + self.timelock_duration;
        expiry_time < near_sdk::env::block_timestamp()
    }

    pub fn can_be_cancelled(&self) -> bool {
        self.status == SwapStatus::Pending && self.is_expired()
    }

    pub fn can_be_completed(&self) -> bool {
        self.status == SwapStatus::Pending && !self.is_expired()
    }
} 