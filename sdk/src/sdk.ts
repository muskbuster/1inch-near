import { LimitOrderProtocol } from './limit-order-protocol';
import { CrossChainEscrow } from './cross-chain-escrow';
import { SolverRegistry } from './solver-registry';
import { generateSecret, hashSecret } from './utils/crypto';

export interface TEE1inchSDKConfig {
  solverRegistryId: string;
  limitOrderProtocolId: string;
  crossChainEscrowId: string;
  networkId?: string;
}

export class TEE1inchSDK {
  public limitOrderProtocol: LimitOrderProtocol;
  public crossChainEscrow: CrossChainEscrow;
  public solverRegistry: SolverRegistry;

  constructor(config: TEE1inchSDKConfig) {
    this.limitOrderProtocol = new LimitOrderProtocol(config.limitOrderProtocolId);
    this.crossChainEscrow = new CrossChainEscrow(config.crossChainEscrowId);
    this.solverRegistry = new SolverRegistry(config.solverRegistryId);
  }

  /**
   * Create a complete cross-chain swap using limit orders and escrows
   */
  async createCrossChainSwap(params: {
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
  }) {
    // Generate secret for the escrow
    const secret = generateSecret();
    const secretHash = hashSecret(secret);

    // Create limit order
    const orderId = await this.limitOrderProtocol.createOrder({
      maker_asset: params.makerAsset,
      taker_asset: params.takerAsset,
      making_amount: params.makingAmount,
      taking_amount: params.takingAmount,
      maker: params.maker,
    });

    // Create cross-chain escrow
    const escrowId = await this.crossChainEscrow.createEscrow({
      maker_asset: params.makerAsset,
      taker_asset: params.takerAsset,
      making_amount: params.makingAmount,
      taking_amount: params.takingAmount,
      maker: params.maker,
      taker: params.taker,
      source_chain: params.sourceChain,
      destination_chain: params.destinationChain,
      timelocks: params.timelocks,
      safety_deposit: params.safetyDeposit,
    });

    return {
      orderId,
      escrowId,
      secret,
      secretHash,
    };
  }

  /**
   * Execute a cross-chain swap (for solvers)
   */
  async executeCrossChainSwap(params: {
    orderId: string;
    escrowId: string;
    secret: string;
    receiver?: string;
  }) {
    // Fill the limit order
    await this.limitOrderProtocol.fillOrder({
      order_id: params.orderId,
      taking_amount: '0', // Will be calculated by the contract
      receiver: params.receiver,
    });

    // Withdraw from escrow using the secret
    await this.crossChainEscrow.withdrawEscrow({
      escrow_id: params.escrowId,
      secret: params.secret,
      receiver: params.receiver,
    });
  }

  /**
   * Generate a new secret for escrow operations
   */
  generateSecret(): string {
    return generateSecret();
  }

  /**
   * Hash a secret for escrow operations
   */
  hashSecret(secret: string): string {
    return hashSecret(secret);
  }
} 