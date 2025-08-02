export type AccountId = string;
export interface Worker {
    accountId: string;
    poolId: number;
    solverType: SolverType;
    collateral: string;
    isActive: boolean;
    registeredAt: number;
}
export interface Pool {
    id: number;
    tokenIds: string[];
    fee: number;
    totalLiquidity: string;
    createdAt: number;
}
export interface PoolInfo {
    id: number;
    tokenIds: string[];
    fee: number;
    totalLiquidity: string;
    createdAt: number;
    workerCount: number;
}
export declare enum SolverType {
    AMM = "AMM",
    LimitOrder = "LimitOrder",
    CrossChain = "CrossChain"
}
//# sourceMappingURL=solver-registry.d.ts.map