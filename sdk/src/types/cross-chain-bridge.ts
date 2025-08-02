export type AccountId = string;

export enum SwapDirection {
  NearToEvm = 'NearToEvm',
  EvmToNear = 'EvmToNear',
}

export enum SwapStatus {
  Pending = 'Pending',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  Failed = 'Failed',
}

export interface CrossChainSwap {
  id: string;
  direction: SwapDirection;
  evmChainId: string;
  nearToken: AccountId;
  evmToken: string;
  amount: string;
  sender: AccountId;
  recipient: string;
  status: SwapStatus;
  secretHash?: string;
  timelockDuration: number;
  createdAt: number;
  completedAt?: number;
}

export interface CrossChainSwapInfo {
  id: string;
  direction: SwapDirection;
  evmChainId: string;
  nearToken: AccountId;
  evmToken: string;
  amount: string;
  sender: AccountId;
  recipient: string;
  status: SwapStatus;
  timelockDuration: number;
  createdAt: number;
  completedAt?: number;
}

export interface EvmChainInfo {
  chainId: string;
  chainName: string;
  bridgeAddress: string;
  isActive: boolean;
}

export interface InitiateNearToEvmParams {
  evmChainId: string;
  nearToken: AccountId;
  evmToken: string;
  amount: string;
  recipient: string;
  timelockDuration?: number;
}

export interface CompleteEvmToNearParams {
  swapId: string;
  secret: string;
  evmTxHash: string;
} 