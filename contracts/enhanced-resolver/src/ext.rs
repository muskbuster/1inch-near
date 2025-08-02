use near_sdk::{
    ext_contract,
    AccountId,
    Gas,
    NearToken,
    Promise,
};

// NEAR Intents interface
#[ext_contract(ext_intents)]
pub trait NearIntents {
    fn execute_intent(&mut self, intent_data: String, memo: Option<String>);
    fn get_intent_status(&self, intent_id: String) -> String;
    fn cancel_intent(&mut self, intent_id: String);
}

// EVM escrow factory interface (1inch integration)
#[ext_contract(ext_evm_escrow_factory)]
pub trait EvmEscrowFactory {
    fn create_src_escrow(&mut self, immutables: String, order: String, args: String);
    fn create_dst_escrow(&mut self, immutables: String, src_cancellation_timestamp: u64);
    fn get_escrow_address(&self, immutables: String) -> String;
}

// EVM resolver interface (1inch integration)
#[ext_contract(ext_evm_resolver)]
pub trait EvmResolver {
    fn deploy_src(&mut self, immutables: String, order: String, args: String);
    fn deploy_dst(&mut self, dst_immutables: String, src_cancellation_timestamp: u64);
    fn withdraw(&mut self, escrow: String, secret: String, immutables: String);
    fn cancel(&mut self, escrow: String, immutables: String);
    fn arbitrary_calls(&mut self, targets: Vec<String>, arguments: Vec<String>);
} 