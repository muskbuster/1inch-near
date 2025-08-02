// Import main SDK classes
import { LimitOrderProtocol } from './limit-order-protocol';
import { CrossChainEscrow } from './cross-chain-escrow';
import { SolverRegistry } from './solver-registry';
import { CrossChainBridge } from './cross-chain-bridge';
import { OneInchIntegration, OneInchEvmConfig } from './integration/1inch-integration';

// Export main SDK classes
export { LimitOrderProtocol } from './limit-order-protocol';
export { CrossChainEscrow } from './cross-chain-escrow';
export { SolverRegistry } from './solver-registry';
export { CrossChainBridge } from './cross-chain-bridge';
export { OneInchIntegration } from './integration/1inch-integration';

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

  constructor(config: {
    limitOrderContractId: string;
    crossChainEscrowContractId: string;
    solverRegistryContractId: string;
    crossChainBridgeContractId: string;
    network?: 'testnet' | 'mainnet';
  }) {
    this.limitOrder = new LimitOrderProtocol(config.limitOrderContractId);
    this.crossChainEscrow = new CrossChainEscrow(config.crossChainEscrowContractId);
    this.solverRegistry = new SolverRegistry(config.solverRegistryContractId);
    this.crossChainBridge = new CrossChainBridge(config.crossChainBridgeContractId);
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
      this.crossChainBridge.isSignedIn()
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