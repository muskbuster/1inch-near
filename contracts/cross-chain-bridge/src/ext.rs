use near_sdk::{
    ext_contract,
    AccountId,
    Gas,
    NearToken,
    Promise,
};

// Fungible token contract interface
#[ext_contract(ext_ft)]
pub trait FungibleToken {
    fn ft_transfer(&mut self, receiver_id: AccountId, amount: String, memo: Option<String>);
    fn ft_transfer_call(&mut self, receiver_id: AccountId, amount: String, msg: String);
    fn ft_balance_of(&self, account_id: AccountId) -> String;
}

// EVM bridge contract interface (for integration with 1inch)
#[ext_contract(ext_evm_bridge)]
pub trait EvmBridge {
    fn execute_swap(&mut self, chain_id: String, token: String, amount: String, recipient: String);
    fn verify_swap(&self, swap_id: String, secret: String, tx_hash: String) -> bool;
    fn get_swap_status(&self, swap_id: String) -> String;
} 