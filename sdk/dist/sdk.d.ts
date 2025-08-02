import { LimitOrderProtocol } from './limit-order-protocol';
import { CrossChainEscrow } from './cross-chain-escrow';
import { SolverRegistry } from './solver-registry';
export interface TEE1inchSDKConfig {
    solverRegistryId: string;
    limitOrderProtocolId: string;
    crossChainEscrowId: string;
    networkId?: string;
}
export declare class TEE1inchSDK {
    limitOrderProtocol: LimitOrderProtocol;
    crossChainEscrow: CrossChainEscrow;
    solverRegistry: SolverRegistry;
    constructor(config: TEE1inchSDKConfig);
    /**
     * Create a complete cross-chain swap using limit orders and escrows
     */
    createCrossChainSwap(params: {
        makerAsset: string;
        takerAsset: string;
        makingAmount: string;
        takingAmount: string;
        maker: string;
        taker: string;
        sourceChain: string;
        destinationChain: string;
        timelocks: {
            finality: number;
            withdrawal: number;
            public_withdrawal: number;
            cancellation: number;
            public_cancellation: number;
        };
        safetyDeposit: string;
    }): Promise<{
        orderId: string;
        escrowId: string;
        secret: string;
        secretHash: string;
    }>;
    /**
     * Execute a cross-chain swap (for solvers)
     */
    executeCrossChainSwap(params: {
        orderId: string;
        escrowId: string;
        secret: string;
        receiver?: string;
    }): Promise<void>;
    /**
     * Generate a new secret for escrow operations
     */
    generateSecret(): string;
    /**
     * Hash a secret for escrow operations
     */
    hashSecret(secret: string): string;
}
//# sourceMappingURL=sdk.d.ts.map