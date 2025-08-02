// Import main SDK classes
import { LimitOrderProtocol } from './limit-order-protocol';
import { CrossChainEscrow } from './cross-chain-escrow';
import { SolverRegistry } from './solver-registry';
import { CrossChainBridge } from './cross-chain-bridge';
import { OneInchIntegration, OneInchEvmConfig } from './integration/1inch-integration';
import { EnhancedResolver } from './enhanced-resolver';

// Export main SDK classes
export { LimitOrderProtocol } from './limit-order-protocol';
export { CrossChainEscrow } from './cross-chain-escrow';
export { SolverRegistry } from './solver-registry';
export { CrossChainBridge } from './cross-chain-bridge';
export { OneInchIntegration } from './integration/1inch-integration';
export { EnhancedResolver } from './enhanced-resolver';

// Export types from limit-order
export type {
  Order,
  OrderInfo,
  OrderStatus,
  CreateOrderParams,
  FillOrderParams,
} from './types/limit-order';

// Export types from cross-chain
export type {
  Escrow,
  EscrowInfo,
  EscrowStatus,
  Timelocks,
  CreateEscrowParams,
  DepositParams,
  WithdrawParams,
} from './types/cross-chain';

// Export types from solver-registry
export type {
  Worker,
  SolverType,
  Pool,
  PoolInfo,
} from './types/solver-registry';

// Export types from cross-chain-bridge
export type {
  CrossChainSwap,
  CrossChainSwapInfo,
  EvmChainInfo,
  SwapDirection,
  SwapStatus,
  InitiateNearToEvmParams,
  CompleteEvmToNearParams,
} from './types/cross-chain-bridge';

// Export types from enhanced-resolver
export type {
  EvmToEvmSwap,
  NearIntentSwap,
  EvmEscrowFactoryInfo,
  EvmResolverInfo,
  ChainConfig,
  EvmSwapStatus,
  NearIntentSwapStatus,
  NearIntentSwapType,
  EvmResolverType,
  ChainType,
  ExecuteEvmToEvmParams,
  ExecuteNearIntentParams,
  CompleteEvmToEvmParams,
  CompleteNearIntentParams,
} from './types/enhanced-resolver';

// Export types from integration
export type {
  OneInchEvmConfig,
  CrossChainSwapRequest,
  CrossChainSwapResponse,
} from './integration/1inch-integration';

// Export utilities
export {
  formatAmount,
  parseAmount,
  nearToYocto,
  yoctoToNear,
} from './utils/amounts';

export {
  generateSecret,
  hashSecret,
  verifySecret,
} from './utils/crypto';

// Main SDK class for easy initialization
export class OneInchNearSDK {
  public limitOrder: LimitOrderProtocol;
  public crossChainEscrow: CrossChainEscrow;
  public solverRegistry: SolverRegistry;
  public crossChainBridge: CrossChainBridge;
  public enhancedResolver: EnhancedResolver;

  constructor(config: {
    limitOrderContractId: string;
    crossChainEscrowContractId: string;
    solverRegistryContractId: string;
    crossChainBridgeContractId: string;
    enhancedResolverContractId: string;
    network?: 'testnet' | 'mainnet';
  }) {
    this.limitOrder = new LimitOrderProtocol(config.limitOrderContractId);
    this.crossChainEscrow = new CrossChainEscrow(config.crossChainEscrowContractId);
    this.solverRegistry = new SolverRegistry(config.solverRegistryContractId);
    this.crossChainBridge = new CrossChainBridge(config.crossChainBridgeContractId);
    this.enhancedResolver = new EnhancedResolver(config.enhancedResolverContractId);
  }

  /**
   * Initialize all contracts
   */
  async initialize(network: 'testnet' | 'mainnet' = 'testnet'): Promise<void> {
    await Promise.all([
      this.limitOrder.initialize(network),
      this.crossChainEscrow.initialize(network),
      this.solverRegistry.initialize(network),
      this.crossChainBridge.initialize(network),
      this.enhancedResolver.initialize(network),
    ]);
  }

  /**
   * Check if user is signed in to all contracts
   */
  isSignedIn(): boolean {
    return (
      this.limitOrder.isSignedIn() &&
      this.crossChainEscrow.isSignedIn() &&
      this.solverRegistry.isSignedIn() &&
      this.crossChainBridge.isSignedIn() &&
      this.enhancedResolver.isSignedIn()
    );
  }

  /**
   * Sign out from all contracts
   */
  signOut(): void {
    this.limitOrder.signOut();
    this.crossChainEscrow.signOut();
    this.solverRegistry.signOut();
    this.crossChainBridge.signOut();
    this.enhancedResolver.signOut();
  }

  /**
   * Create 1inch integration instance
   */
  createOneInchIntegration(evmConfig: OneInchEvmConfig): OneInchIntegration {
    return new OneInchIntegration(
      this.crossChainBridge,
      this.limitOrder,
      this.crossChainEscrow,
      evmConfig
    );
  }
} 