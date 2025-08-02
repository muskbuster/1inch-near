export type AccountId = string;

export interface Order {
  maker_asset: AccountId;
  taker_asset: AccountId;
  making_amount: string;
  taking_amount: string;
  maker: AccountId;
  receiver: AccountId;
  salt: string;
  expiration?: number;
  allowed_sender?: AccountId;
  filled_amount: string;
  cancelled: boolean;
}

export interface OrderInfo {
  order_id: string;
  order: Order;
  status: OrderStatus;
}

export enum OrderStatus {
  Active = 'Active',
  Filled = 'Filled',
  Cancelled = 'Cancelled',
  Expired = 'Expired',
}

export interface CreateOrderParams {
  maker_asset: AccountId;
  taker_asset: AccountId;
  making_amount: string;
  taking_amount: string;
  maker: AccountId;
  receiver?: AccountId;
  salt?: string;
  expiration?: number;
  allowed_sender?: AccountId;
}

export interface FillOrderParams {
  order_id: string;
  taking_amount: string;
  receiver?: AccountId;
} 