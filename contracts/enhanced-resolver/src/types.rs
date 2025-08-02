use near_sdk::{
    borsh::{BorshDeserialize, BorshSerialize},
    serde::{Deserialize, Serialize},
    AccountId, Timestamp,
};

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum EvmSwapStatus {
    Pending,
    Completed,
    Failed,
    Cancelled,
}

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum NearIntentSwapStatus {
    Pending,
    Completed,
    Failed,
    Cancelled,
}

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum NearIntentSwapType {
    NearToEvm,
    EvmToNear,
    EvmToEvm,
}

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum ChainType {
    Near,
    Evm,
    Solana,
    Cosmos,
}

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum EvmResolverType {
    CrossChain,
    LimitOrder,
    Aggregation,
    Fusion,
}

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Serialize, Deserialize)]
pub struct EvmToEvmSwap {
    pub id: String,
    pub from_chain: String,
    pub to_chain: String,
    pub from_token: String,
    pub to_token: String,
    pub amount: u128,
    pub recipient: String,
    pub status: EvmSwapStatus,
    pub intent_data: String, // NEAR Intents data for coordination
    pub created_at: Timestamp,
    pub completed_at: Option<Timestamp>,
}

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Serialize, Deserialize)]
pub struct NearIntentSwap {
    pub id: String,
    pub swap_type: NearIntentSwapType,
    pub source_chain: String,
    pub destination_chain: String,
    pub source_token: String,
    pub destination_token: String,
    pub amount: u128,
    pub recipient: String,
    pub status: NearIntentSwapStatus,
    pub intent_data: String, // NEAR Intents data
    pub created_at: Timestamp,
    pub completed_at: Option<Timestamp>,
}

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Serialize, Deserialize)]
pub struct EvmEscrowFactoryInfo {
    pub chain_id: String,
    pub factory_address: String,
    pub escrow_src_implementation: String,
    pub escrow_dst_implementation: String,
    pub is_active: bool,
}

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Serialize, Deserialize)]
pub struct EvmResolverInfo {
    pub chain_id: String,
    pub resolver_address: String,
    pub resolver_type: EvmResolverType,
    pub is_active: bool,
}

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Serialize, Deserialize)]
pub struct ChainConfig {
    pub chain_id: String,
    pub chain_name: String,
    pub chain_type: ChainType,
    pub rpc_url: String,
    pub is_active: bool,
}

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Serialize, Deserialize)]
pub struct EvmToEvmSwapInfo {
    pub id: String,
    pub from_chain: String,
    pub to_chain: String,
    pub from_token: String,
    pub to_token: String,
    pub amount: u128,
    pub recipient: String,
    pub status: EvmSwapStatus,
    pub created_at: Timestamp,
    pub completed_at: Option<Timestamp>,
}

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Serialize, Deserialize)]
pub struct NearIntentSwapInfo {
    pub id: String,
    pub swap_type: NearIntentSwapType,
    pub source_chain: String,
    pub destination_chain: String,
    pub source_token: String,
    pub destination_token: String,
    pub amount: u128,
    pub recipient: String,
    pub status: NearIntentSwapStatus,
    pub created_at: Timestamp,
    pub completed_at: Option<Timestamp>,
}

impl EvmToEvmSwap {
    pub fn is_expired(&self) -> bool {
        // 24 hour expiry for EVM to EVM swaps
        let expiry_time = self.created_at + 24 * 60 * 60 * 1_000_000_000; // 24 hours in nanoseconds
        expiry_time < near_sdk::env::block_timestamp()
    }

    pub fn can_be_cancelled(&self) -> bool {
        self.status == EvmSwapStatus::Pending && self.is_expired()
    }

    pub fn can_be_completed(&self) -> bool {
        self.status == EvmSwapStatus::Pending && !self.is_expired()
    }
}

impl NearIntentSwap {
    pub fn is_expired(&self) -> bool {
        // 1 hour expiry for NEAR Intents swaps
        let expiry_time = self.created_at + 60 * 60 * 1_000_000_000; // 1 hour in nanoseconds
        expiry_time < near_sdk::env::block_timestamp()
    }

    pub fn can_be_cancelled(&self) -> bool {
        self.status == NearIntentSwapStatus::Pending && self.is_expired()
    }

    pub fn can_be_completed(&self) -> bool {
        self.status == NearIntentSwapStatus::Pending && !self.is_expired()
    }
} 