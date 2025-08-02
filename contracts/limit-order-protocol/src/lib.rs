use near_sdk::{
    borsh::{BorshDeserialize, BorshSerialize},
    env, near, AccountId, Gas, NearToken, PanicOnDefault, Promise, Timestamp,
};

mod events;
mod ext;
mod order;
mod types;

use events::*;
use ext::*;
use types::*;

// Gas constants
const GAS_FOR_FT_TRANSFER: Gas = Gas::from_tgas(10);
const GAS_FOR_FT_TRANSFER_CALLBACK: Gas = Gas::from_tgas(10);

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct LimitOrderProtocol {
    pub owner_id: AccountId,
    pub orders: std::collections::HashMap<String, Order>,
    pub orders_by_maker: std::collections::HashMap<AccountId, Vec<String>>,
    pub next_order_id: u64,
}

#[near]
impl LimitOrderProtocol {
    #[init]
    pub fn new(owner_id: AccountId) -> Self {
        Self {
            owner_id,
            orders: std::collections::HashMap::new(),
            orders_by_maker: std::collections::HashMap::new(),
            next_order_id: 1,
        }
    }

    /// Create a new limit order
    pub fn create_order(
        &mut self,
        maker_asset: AccountId,
        taker_asset: AccountId,
        making_amount: u128,
        taking_amount: u128,
        maker: AccountId,
        expiration: Timestamp,
    ) -> String {
        // Validate inputs
        assert!(making_amount > 0, "Making amount must be greater than 0");
        assert!(taking_amount > 0, "Taking amount must be greater than 0");
        assert!(expiration > env::block_timestamp(), "Order must not be expired");
        assert!(maker == env::predecessor_account_id(), "Only maker can create order");

        // Generate order ID
        let order_id = format!("order_{}", self.next_order_id);
        self.next_order_id += 1;

        // Create order
        let order = Order {
            id: order_id.clone(),
            maker_asset,
            taker_asset,
            making_amount,
            taking_amount,
            maker: maker.clone(),
            expiration,
            status: OrderStatus::Open,
            created_at: env::block_timestamp(),
        };

        // Store order
        self.orders.insert(order_id.clone(), order.clone());

        // Add to maker's orders
        self.orders_by_maker
            .entry(maker.clone())
            .or_insert_with(Vec::new)
            .push(order_id.clone());

        // Emit event
        OrderCreated {
            order_id: order_id.clone(),
            maker,
            maker_asset: order.maker_asset,
            taker_asset: order.taker_asset,
            making_amount: order.making_amount,
            taking_amount: order.taking_amount,
        }
        .emit();

        order_id
    }

    /// Fill a limit order
    pub fn fill_order(
        &mut self,
        order_id: String,
        taker_amount: u128,
    ) -> Promise {
        // Get order
        let mut order = self
            .orders
            .get(&order_id)
            .expect("Order not found")
            .clone();

        // Validate order
        assert!(order.status == OrderStatus::Open, "Order is not open");
        assert!(env::block_timestamp() < order.expiration, "Order is expired");
        assert!(taker_amount <= order.taking_amount, "Amount exceeds order size");

        // Calculate maker amount
        let maker_amount = (order.making_amount * taker_amount) / order.taking_amount;

        // Update order
        order.taking_amount -= taker_amount;
        order.making_amount -= maker_amount;

        if order.taking_amount == 0 {
            order.status = OrderStatus::Filled;
        }

        // Store updated order
        self.orders.insert(order_id.clone(), order.clone());

        // Transfer tokens
        let taker = env::predecessor_account_id();

        // Transfer maker asset from maker to taker
        let transfer_maker_promise = ext_ft::ext(order.maker_asset.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .with_static_gas(GAS_FOR_FT_TRANSFER)
            .ft_transfer(
                taker.clone(),
                maker_amount,
                Some(format!("Fill order {}", order_id)),
            );

        // Transfer taker asset from taker to maker
        let transfer_taker_promise = ext_ft::ext(order.taker_asset.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .with_static_gas(GAS_FOR_FT_TRANSFER)
            .ft_transfer(
                order.maker.clone(),
                taker_amount,
                Some(format!("Fill order {}", order_id)),
            );

        // Emit event
        OrderFilled {
            order_id: order_id.clone(),
            maker: order.maker,
            taker,
            maker_asset: order.maker_asset,
            taker_asset: order.taker_asset,
            maker_amount,
            taker_amount,
        }
        .emit();

        // Return promises
        transfer_maker_promise.then(transfer_taker_promise)
    }

    /// Cancel an order
    pub fn cancel_order(&mut self, order_id: String) {
        let mut order = self
            .orders
            .get(&order_id)
            .expect("Order not found")
            .clone();

        // Validate cancellation
        assert!(order.maker == env::predecessor_account_id(), "Only maker can cancel");
        assert!(order.status == OrderStatus::Open, "Order is not open");

        // Update order
        order.status = OrderStatus::Cancelled;

        // Store updated order
        self.orders.insert(order_id.clone(), order.clone());

        // Remove from maker's orders
        if let Some(maker_orders) = self.orders_by_maker.get_mut(&order.maker) {
            maker_orders.retain(|id| id != &order_id);
        }

        // Emit event
        OrderCancelled {
            order_id: order_id.clone(),
            maker: order.maker,
        }
        .emit();
    }

    /// Get order by ID
    pub fn get_order(&self, order_id: String) -> Option<OrderInfo> {
        self.orders.get(&order_id).map(|order| OrderInfo {
            id: order.id.clone(),
            maker_asset: order.maker_asset.clone(),
            taker_asset: order.taker_asset.clone(),
            making_amount: order.making_amount,
            taking_amount: order.taking_amount,
            maker: order.maker.clone(),
            expiration: order.expiration,
            status: order.status.clone(),
            created_at: order.created_at,
        })
    }

    /// Get orders by maker
    pub fn get_orders_by_maker(&self, maker: AccountId) -> Vec<OrderInfo> {
        self.orders_by_maker
            .get(&maker)
            .map(|order_ids| {
                order_ids
                    .iter()
                    .filter_map(|id| self.get_order(id.clone()))
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Generate a hash for order verification
    pub fn hash_order_data(&self, data: String) -> String {
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(data.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    /// Generate a random order ID
    pub fn generate_order_id(&self) -> String {
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(env::random_seed());
        format!("order_{:x}", hasher.finalize())
    }
} 
} 
} 
