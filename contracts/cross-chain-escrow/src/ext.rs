use near_sdk::ext_contract;

#[ext_contract(ext_ft)]
pub trait FungibleToken {
    fn ft_transfer(&mut self, receiver_id: near_sdk::AccountId, amount: u128, memo: Option<String>);
    fn ft_transfer_call(
        &mut self,
        receiver_id: near_sdk::AccountId,
        amount: u128,
        msg: String,
    ) -> near_sdk::Promise;
}

#[ext_contract(ext_intents)]
pub trait IntentsContract {
    fn deposit(token_id: near_sdk::AccountId, amount: u128, receiver_id: near_sdk::AccountId);
    fn withdraw(token_id: near_sdk::AccountId, amount: u128, receiver_id: near_sdk::AccountId);
} 