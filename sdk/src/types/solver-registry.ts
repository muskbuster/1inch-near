export type AccountId = string;

export interface Worker {
  pool_id: number;
  checksum: string;
  codehash: string;
  solver_type: SolverType;
}

export enum SolverType {
  AMM = 'AMM',
  LimitOrder = 'LimitOrder',
  CrossChain = 'CrossChain',
}

export interface Pool {
  token_ids: AccountId[];
  amounts: string[];
  fee: number;
  shares_total_supply: string;
}

export interface PoolInfo {
  token_ids: AccountId[];
  amounts: string[];
  fee: number;
  shares_total_supply: string;
}
 