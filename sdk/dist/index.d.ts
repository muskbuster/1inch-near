import { LimitOrderProtocol } from './limit-order-protocol';
import { CrossChainEscrow } from './cross-chain-escrow';
import { SolverRegistry } from './solver-registry';
export { LimitOrderProtocol } from './limit-order-protocol';
export { CrossChainEscrow } from './cross-chain-escrow';
export { SolverRegistry } from './solver-registry';
export type { Order, OrderInfo, OrderStatus, CreateOrderParams, FillOrderParams, } from './types/limit-order';
export type { Escrow, EscrowInfo, EscrowStatus, Timelocks, CreateEscrowParams, DepositParams, WithdrawParams, } from './types/cross-chain';
export type { Worker, SolverType, Pool, PoolInfo, } from './types/solver-registry';
export { formatAmount, parseAmount, nearToYocto, yoctoToNear, } from './utils/amounts';
export { generateSecret, hashSecret, verifySecret, } from './utils/crypto';
export declare class OneInchNearSDK {
    limitOrder: LimitOrderProtocol;
    crossChainEscrow: CrossChainEscrow;
    solverRegistry: SolverRegistry;
    constructor(config: {
        limitOrderContractId: string;
        crossChainEscrowContractId: string;
        solverRegistryContractId: string;
        network?: 'testnet' | 'mainnet';
    });
    /**
     * Initialize all contracts
     */
    initialize(network?: 'testnet' | 'mainnet'): Promise<void>;
    /**
     * Check if user is signed in to all contracts
     */
    isSignedIn(): boolean;
    /**
     * Sign out from all contracts
     */
    signOut(): void;
}
//# sourceMappingURL=index.d.ts.map