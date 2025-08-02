use near_sdk::{
    serde::{Deserialize, Serialize},
    AccountId,
};

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct OrderCreated {
    pub order_id: String,
    pub maker: AccountId,
    pub maker_asset: AccountId,
    pub taker_asset: AccountId,
    pub making_amount: u128,
    pub taking_amount: u128,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct OrderFilled {
    pub order_id: String,
    pub maker: AccountId,
    pub taker: AccountId,
    pub maker_asset: AccountId,
    pub taker_asset: AccountId,
    pub maker_amount: u128,
    pub taker_amount: u128,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct OrderCancelled {
    pub order_id: String,
    pub maker: AccountId,
}

pub trait Event {
    fn emit(&self);
}

impl Event for OrderCreated {
    fn emit(&self) {
        near_sdk::env::log_str(&format!("EVENT_JSON:{}", serde_json::to_string(self).unwrap()));
    }
}

impl Event for OrderFilled {
    fn emit(&self) {
        near_sdk::env::log_str(&format!("EVENT_JSON:{}", serde_json::to_string(self).unwrap()));
    }
}

impl Event for OrderCancelled {
    fn emit(&self) {
        near_sdk::env::log_str(&format!("EVENT_JSON:{}", serde_json::to_string(self).unwrap()));
    }
} 