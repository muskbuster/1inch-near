use near_sdk::{
    borsh::{BorshDeserialize, BorshSerialize},
    serde::{Deserialize, Serialize},
    Timestamp,
};

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Serialize, Deserialize)]
pub struct Timelocks {
    pub finality: u64,           // Time for finality
    pub withdrawal: u64,          // Time for withdrawal
    pub public_withdrawal: u64,   // Time for public withdrawal
    pub cancellation: u64,        // Time for cancellation
    pub public_cancellation: u64, // Time for public cancellation
}

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum TimelockStage {
    Finality,
    Withdrawal,
    PublicWithdrawal,
    Cancellation,
    PublicCancellation,
    Expired,
}

impl Timelocks {
    pub fn new(
        finality: u64,
        withdrawal: u64,
        public_withdrawal: u64,
        cancellation: u64,
        public_cancellation: u64,
    ) -> Self {
        Self {
            finality,
            withdrawal,
            public_withdrawal,
            public_cancellation,
            cancellation,
        }
    }

    pub fn get_current_stage(&self, created_at: Timestamp) -> TimelockStage {
        let now = near_sdk::env::block_timestamp();
        let elapsed = now - created_at;

        if elapsed < self.finality {
            TimelockStage::Finality
        } else if elapsed < self.withdrawal {
            TimelockStage::Withdrawal
        } else if elapsed < self.public_withdrawal {
            TimelockStage::PublicWithdrawal
        } else if elapsed < self.cancellation {
            TimelockStage::Cancellation
        } else if elapsed < self.public_cancellation {
            TimelockStage::PublicCancellation
        } else {
            TimelockStage::Expired
        }
    }

    pub fn is_expired(&self) -> bool {
        // This would need to be called with the escrow's created_at timestamp
        // For now, return false - this should be implemented in the Escrow struct
        false
    }

    pub fn can_withdraw(&self) -> bool {
        // This would need to be called with the escrow's created_at timestamp
        // For now, return true - this should be implemented in the Escrow struct
        true
    }

    pub fn can_cancel(&self) -> bool {
        // This would need to be called with the escrow's created_at timestamp
        // For now, return true - this should be implemented in the Escrow struct
        true
    }
} 