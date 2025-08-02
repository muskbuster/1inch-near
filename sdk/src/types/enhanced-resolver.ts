export type AccountId = string;

export enum EvmSwapStatus {
  Pending = 'Pending',
  Completed = 'Completed',
  Failed = 'Failed',
  Cancelled = 'Cancelled',
}

export enum NearIntentSwapStatus {
  Pending = 'Pending',
  Completed = 'Completed',
  Failed = 'Failed',
  Cancelled = 'Cancelled',
}

export enum NearIntentSwapType {
  NearToEvm = 'NearToEvm',
  EvmToNear = 'EvmToNear',
  EvmToEvm = 'EvmToEvm',
}

export enum ChainType {
  Near = 'Near',
  Evm = 'Evm',
  Solana = 'Solana',
  Cosmos = 'Cosmos',
}

export enum EvmResolverType {
  CrossChain = 'CrossChain',
  LimitOrder = 'LimitOrder',
  Aggregation = 'Aggregation',
  Fusion = 'Fusion',
}

export interface EvmToEvmSwap {
  id: string;
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  amount: string;
  recipient: string;
  status: EvmSwapStatus;
  intentData: string;
  createdAt: number;
  completedAt?: number;
}

export interface NearIntentSwap {
  id: string;
  swapType: NearIntentSwapType;
  sourceChain: string;
  destinationChain: string;
  sourceToken: string;
  destinationToken: string;
  amount: string;
  recipient: string;
  status: NearIntentSwapStatus;
  intentData: string;
  createdAt: number;
  completedAt?: number;
}

export interface EvmEscrowFactoryInfo {
  chainId: string;
  factoryAddress: string;
  escrowSrcImplementation: string;
  escrowDstImplementation: string;
  isActive: boolean;
}

export interface EvmResolverInfo {
  chainId: string;
  resolverAddress: string;
  resolverType: EvmResolverType;
  isActive: boolean;
}

export interface ChainConfig {
  chainId: string;
  chainName: string;
  chainType: ChainType;
  rpcUrl: string;
  isActive: boolean;
}

export interface EvmToEvmSwapInfo {
  id: string;
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  amount: string;
  recipient: string;
  status: EvmSwapStatus;
  createdAt: number;
  completedAt?: number;
}

export interface NearIntentSwapInfo {
  id: string;
  swapType: NearIntentSwapType;
  sourceChain: string;
  destinationChain: string;
  sourceToken: string;
  destinationToken: string;
  amount: string;
  recipient: string;
  status: NearIntentSwapStatus;
  createdAt: number;
  completedAt?: number;
}

export interface ExecuteEvmToEvmParams {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  amount: string;
  recipient: string;
  intentData: string;
}

export interface ExecuteNearIntentParams {
  swapType: NearIntentSwapType;
  sourceChain: string;
  destinationChain: string;
  sourceToken: string;
  destinationToken: string;
  amount: string;
  recipient: string;
  intentData: string;
}

export interface CompleteEvmToEvmParams {
  swapId: string;
  evmTxHash: string;
  proofData: string;
}

export interface CompleteNearIntentParams {
  swapId: string;
  completionData: string;
} 