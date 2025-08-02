import { Worker, SolverType, Pool } from './types/solver-registry';
export declare class SolverRegistry {
    private contractId;
    constructor(contractId: string);
    /**
     * Register a worker with TEE verification
     */
    registerWorker(poolId: number, quoteHex: string, collateral: string, checksum: string, tcbInfo: string, solverType: SolverType): Promise<void>;
    /**
     * Create a new liquidity pool
     */
    createLiquidityPool(tokenIds: string[], fee: number): Promise<number | null>;
    /**
     * Get pool by ID
     */
    getPool(poolId: number): Promise<Pool | null>;
    /**
     * Get worker by account ID
     */
    getWorker(accountId: string): Promise<Worker | null>;
    /**
     * Check if a worker has permission for a specific solver type
     */
    hasSolverPermission(workerId: string, solverType: SolverType): Promise<boolean>;
    /**
     * Get solver permissions for a worker
     */
    getSolverPermissions(workerId: string): Promise<SolverType[]>;
    /**
     * Get limit order protocol contract ID
     */
    getLimitOrderProtocolId(): Promise<string>;
    /**
     * Get cross-chain escrow contract ID
     */
    getCrossChainEscrowId(): Promise<string>;
}
//# sourceMappingURL=solver-registry.d.ts.map