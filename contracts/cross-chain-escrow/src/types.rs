use near_sdk::{
    borsh::{BorshDeserialize, BorshSerialize},
    serde::{Deserialize, Serialize},
    AccountId, Timestamp,
};

use crate::timelocks::Timelocks;

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug)]
pub struct Escrow {
    pub id: String,
    pub maker: AccountId,
    pub taker: AccountId,
    pub maker_asset: AccountId,
    pub taker_asset: AccountId,
    pub making_amount: u128,
    pub taking_amount: u128,
    pub secret_hash: String,
    pub timelocks: Timelocks,
    pub status: EscrowStatus,
    pub created_at: Timestamp,
    pub funded_at: Option<Timestamp>,
}

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum EscrowStatus {
    Created,
    Funded,
    Withdrawn,
    Cancelled,
}

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Serialize, Deserialize)]
pub struct EscrowInfo {
    pub id: String,
    pub maker: AccountId,
    pub taker: AccountId,
    pub maker_asset: AccountId,
    pub taker_asset: AccountId,
    pub making_amount: u128,
    pub taking_amount: u128,
    pub secret_hash: String,
    pub timelocks: Timelocks,
    pub status: EscrowStatus,
    pub created_at: Timestamp,
    pub funded_at: Option<Timestamp>,
}

impl Escrow {
    pub fn is_expired(&self) -> bool {
        self.timelocks.is_expired()
    }

    pub fn can_withdraw(&self) -> bool {
        self.timelocks.can_withdraw()
    }

    pub fn can_cancel(&self) -> bool {
        self.timelocks.can_cancel()
    }
} 