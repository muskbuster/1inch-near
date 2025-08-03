use near_sdk::{
    serde::{Deserialize, Serialize},
    AccountId,
};

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct EscrowCreated {
    pub escrow_id: String,
    pub maker: AccountId,
    pub taker: AccountId,
    pub maker_asset: AccountId,
    pub taker_asset: AccountId,
    pub making_amount: u128,
    pub taking_amount: u128,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct EscrowFunded {
    pub escrow_id: String,
    pub taker: AccountId,
    pub secret_hash: String,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct EscrowWithdrawn {
    pub escrow_id: String,
    pub secret: String,
    pub receiver: AccountId,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct EscrowCancelled {
    pub escrow_id: String,
    pub taker: AccountId,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct ContractPaused {}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct ContractUnpaused {}

pub trait Event {
    fn emit(&self);
}

impl Event for EscrowCreated {
    fn emit(&self) {
        near_sdk::env::log_str(&format!("EVENT_JSON:{}", serde_json::to_string(self).unwrap()));
    }
}

impl Event for EscrowFunded {
    fn emit(&self) {
        near_sdk::env::log_str(&format!("EVENT_JSON:{}", serde_json::to_string(self).unwrap()));
    }
}

impl Event for EscrowWithdrawn {
    fn emit(&self) {
        near_sdk::env::log_str(&format!("EVENT_JSON:{}", serde_json::to_string(self).unwrap()));
    }
}

impl Event for EscrowCancelled {
    fn emit(&self) {
        near_sdk::env::log_str(&format!("EVENT_JSON:{}", serde_json::to_string(self).unwrap()));
    }
}

impl Event for ContractPaused {
    fn emit(&self) {
        near_sdk::env::log_str(&format!("EVENT_JSON:{}", serde_json::to_string(self).unwrap()));
    }
}

impl Event for ContractUnpaused {
    fn emit(&self) {
        near_sdk::env::log_str(&format!("EVENT_JSON:{}", serde_json::to_string(self).unwrap()));
    }
} 