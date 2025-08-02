use near_sdk::{near, AccountId, BorshStorageKey};

pub type Balance = u128;

#[near]
#[derive(BorshStorageKey)]
pub enum Prefix {
    Pools,
    PoolShares,
    ApprovedCodeHashes,
    WorkerByAccountId,
    SolverPermissions,
}

#[near(serializers = [json, borsh])]
#[derive(Clone, PartialEq, Eq)]
pub enum SolverType {
    AMM,        // Automated Market Maker solver
    LimitOrder, // 1inch-style limit order solver
    CrossChain, // Cross-chain swap solver
}

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct Worker {
    pub pool_id: u32,
    pub checksum: String,
    pub codehash: String,
    pub solver_type: SolverType,
}

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct Pool {
    token_ids: Vec<AccountId>,
    amounts: Vec<u128>, // Changed from Vector to Vec for serialization
    fee: u32,
    shares_total_supply: u128,
}

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct PoolInfo {
    pub token_ids: Vec<AccountId>,
    pub amounts: Vec<u128>,
    pub fee: u32,
    pub shares_total_supply: u128,
}
