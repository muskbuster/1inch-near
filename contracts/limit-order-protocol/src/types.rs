use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize},
    serde::{Deserialize, Serialize},
    AccountId, Timestamp,
};

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug)]
pub struct Order {
    pub id: String,
    pub maker_asset: AccountId,
    pub taker_asset: AccountId,
    pub making_amount: u128,
    pub taking_amount: u128,
    pub maker: AccountId,
    pub expiration: Timestamp,
    pub status: OrderStatus,
    pub created_at: Timestamp,
}

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Serialize, Deserialize)]
pub struct OrderInfo {
    pub id: String,
    pub maker_asset: AccountId,
    pub taker_asset: AccountId,
    pub making_amount: u128,
    pub taking_amount: u128,
    pub maker: AccountId,
    pub expiration: Timestamp,
    pub status: OrderStatus,
    pub created_at: Timestamp,
}

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum OrderStatus {
    Open,
    Filled,
    Cancelled,
    Expired,
}

impl Order {
    pub fn is_expired(&self) -> bool {
        self.expiration < near_sdk::env::block_timestamp()
    }

    pub fn remaining_making_amount(&self) -> u128 {
        self.making_amount
    }

    pub fn remaining_taking_amount(&self) -> u128 {
        self.taking_amount
    }
} 