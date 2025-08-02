export type AccountId = string;

export interface Escrow {
  id: string;
  maker: AccountId;
  taker: AccountId;
  makerAsset: AccountId;
  takerAsset: AccountId;
  makingAmount: string;
  takingAmount: string;
  secretHash: string;
  timelocks: Timelocks;
  status: EscrowStatus;
  createdAt: number;
  fundedAt?: number;
}

export interface EscrowInfo {
  id: string;
  maker: AccountId;
  taker: AccountId;
  makerAsset: AccountId;
  takerAsset: AccountId;
  makingAmount: string;
  takingAmount: string;
  secretHash: string;
  timelocks: Timelocks;
  status: EscrowStatus;
  createdAt: number;
  fundedAt?: number;
}

export interface Timelocks {
  finalityPeriod: number;
  withdrawalPeriod: number;
  cancellationPeriod: number;
}

export enum EscrowStatus {
  Pending = 'Pending',
  Funded = 'Funded',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  Expired = 'Expired',
}

export interface CreateEscrowParams {
  makerAsset: AccountId;
  takerAsset: AccountId;
  makingAmount: string;
  takingAmount: string;
  timelocks: Timelocks;
}

export interface DepositParams {
  escrowId: string;
  amount: string;
}

export interface WithdrawParams {
  escrowId: string;
  secret: string;
} 