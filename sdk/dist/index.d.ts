import { LimitOrderProtocol } from './limit-order-protocol';
import { CrossChainEscrow } from './cross-chain-escrow';
import { SolverRegistry } from './solver-registry';
import { CrossChainBridge } from './cross-chain-bridge';
import { OneInchIntegration, OneInchEvmConfig } from './integration/1inch-integration';
import { EnhancedResolver } from './enhanced-resolver';
export { LimitOrderProtocol } from './limit-order-protocol';
export { CrossChainEscrow } from './cross-chain-escrow';
export { SolverRegistry } from './solver-registry';
export { CrossChainBridge } from './cross-chain-bridge';
export { OneInchIntegration } from './integration/1inch-integration';
export { EnhancedResolver } from './enhanced-resolver';
export type { Order, OrderInfo, OrderStatus, CreateOrderParams, FillOrderParams, } from './types/limit-order';
export type { Escrow, EscrowInfo, EscrowStatus, Timelocks, CreateEscrowParams, DepositParams, WithdrawParams, } from './types/cross-chain';
export type { Worker, SolverType, Pool, PoolInfo, } from './types/solver-registry';
export type { CrossChainSwap, CrossChainSwapInfo, EvmChainInfo, SwapDirection, SwapStatus, InitiateNearToEvmParams, CompleteEvmToNearParams, } from './types/cross-chain-bridge';
export type { EvmToEvmSwap, NearIntentSwap, EvmEscrowFactoryInfo, EvmResolverInfo, ChainConfig, EvmSwapStatus, NearIntentSwapStatus, NearIntentSwapType, EvmResolverType, ChainType, ExecuteEvmToEvmParams, ExecuteNearIntentParams, CompleteEvmToEvmParams, CompleteNearIntentParams, } from './types/enhanced-resolver';
export type { OneInchEvmConfig, CrossChainSwapRequest, CrossChainSwapResponse, } from './integration/1inch-integration';
export { formatAmount, parseAmount, nearToYocto, yoctoToNear, } from './utils/amounts';
export { generateSecret, hashSecret, verifySecret, } from './utils/crypto';
export declare class OneInchNearSDK {
    limitOrder: LimitOrderProtocol;
    crossChainEscrow: CrossChainEscrow;
    solverRegistry: SolverRegistry;
    crossChainBridge: CrossChainBridge;
    enhancedResolver: EnhancedResolver;
    constructor(config: {
        limitOrderContractId: string;
        crossChainEscrowContractId: string;
        solverRegistryContractId: string;
        crossChainBridgeContractId: string;
        enhancedResolverContractId: string;
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
    /**
     * Create 1inch integration instance
     */
    createOneInchIntegration(evmConfig: OneInchEvmConfig): OneInchIntegration;
}
//# sourceMappingURL=index.d.ts.map