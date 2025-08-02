export type AccountId = string;

export interface Order {
  id: string;
  makerAsset: AccountId;
  takerAsset: AccountId;
  makingAmount: string;
  takingAmount: string;
  maker: AccountId;
  expiration: number;
  status: OrderStatus;
  createdAt: number;
}

export interface OrderInfo {
  id: string;
  makerAsset: AccountId;
  takerAsset: AccountId;
  makingAmount: string;
  takingAmount: string;
  maker: AccountId;
  expiration: number;
  status: OrderStatus;
  createdAt: number;
}

export enum OrderStatus {
  Open = 'Open',
  Filled = 'Filled',
  Cancelled = 'Cancelled',
  Expired = 'Expired',
}

export interface CreateOrderParams {
  makerAsset: AccountId;
  takerAsset: AccountId;
  makingAmount: string;
  takingAmount: string;
  expiration?: number;
}

export interface FillOrderParams {
  orderId: string;
  takerAmount: string;
} 