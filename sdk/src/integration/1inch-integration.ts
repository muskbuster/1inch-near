import { CrossChainBridge } from '../cross-chain-bridge';
import { LimitOrderProtocol } from '../limit-order-protocol';
import { CrossChainEscrow } from '../cross-chain-escrow';
import {
  SwapDirection,
  SwapStatus,
  InitiateNearToEvmParams,
  CompleteEvmToNearParams,
} from '../types/cross-chain-bridge';

export interface OneInchEvmConfig {
  apiKey: string;
  baseUrl: string;
  supportedChains: string[];
}

export interface CrossChainSwapRequest {
  fromChain: 'near' | string;
  toChain: 'near' | string;
  fromToken: string;
  toToken: string;
  amount: string;
  recipient: string;
  slippage?: number;
}

export interface CrossChainSwapResponse {
  swapId: string;
  status: SwapStatus;
  estimatedTime: number;
  fees: {
    near: string;
    evm: string;
  };
}

export class OneInchIntegration {
  private crossChainBridge: CrossChainBridge;
  private limitOrderProtocol: LimitOrderProtocol;
  private crossChainEscrow: CrossChainEscrow;
  private evmConfig: OneInchEvmConfig;

  constructor(
    crossChainBridge: CrossChainBridge,
    limitOrderProtocol: LimitOrderProtocol,
    crossChainEscrow: CrossChainEscrow,
    evmConfig: OneInchEvmConfig
  ) {
    this.crossChainBridge = crossChainBridge;
    this.limitOrderProtocol = limitOrderProtocol;
    this.crossChainEscrow = crossChainEscrow;
    this.evmConfig = evmConfig;
  }

  /**
   * Get quote for cross-chain swap
   */
  async getCrossChainQuote(request: CrossChainSwapRequest): Promise<any> {
    const { fromChain, toChain, fromToken, toToken, amount } = request;

    if (fromChain === 'near' && toChain !== 'near') {
      // NEAR to EVM quote
      return this.getNearToEvmQuote(fromToken, toToken, amount, toChain);
    } else if (fromChain !== 'near' && toChain === 'near') {
      // EVM to NEAR quote
      return this.getEvmToNearQuote(fromToken, toToken, amount, fromChain);
    } else {
      throw new Error('Invalid cross-chain swap request');
    }
  }

  /**
   * Execute cross-chain swap
   */
  async executeCrossChainSwap(request: CrossChainSwapRequest): Promise<CrossChainSwapResponse> {
    const { fromChain, toChain, fromToken, toToken, amount, recipient } = request;

    if (fromChain === 'near' && toChain !== 'near') {
      // NEAR to EVM swap
      return this.executeNearToEvmSwap({
        evmChainId: toChain,
        nearToken: fromToken,
        evmToken: toToken,
        amount,
        recipient,
        timelockDuration: 3600, // 1 hour
      });
    } else if (fromChain !== 'near' && toChain === 'near') {
      // EVM to NEAR swap
      return this.executeEvmToNearSwap({
        evmChainId: fromChain,
        nearToken: toToken,
        evmToken: fromToken,
        amount,
        recipient,
        timelockDuration: 3600, // 1 hour
      });
    } else {
      throw new Error('Invalid cross-chain swap request');
    }
  }

  /**
   * Get quote for NEAR to EVM swap
   */
  private async getNearToEvmQuote(
    nearToken: string,
    evmToken: string,
    amount: string,
    evmChain: string
  ): Promise<any> {
    // Call 1inch API to get quote
    const response = await fetch(
      `${this.evmConfig.baseUrl}/v5.2/${evmChain}/quote?fromTokenAddress=${evmToken}&toTokenAddress=${evmToken}&amount=${amount}`,
      {
        headers: {
          'Authorization': `Bearer ${this.evmConfig.apiKey}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get quote: ${response.statusText}`);
    }

    const quote = await response.json() as any;
    return {
      nearToken,
      evmToken,
      evmChain,
      ...quote,
    };
  }

  /**
   * Get quote for EVM to NEAR swap
   */
  private async getEvmToNearQuote(
    evmToken: string,
    nearToken: string,
    amount: string,
    evmChain: string
  ): Promise<any> {
    // For EVM to NEAR, we need to get the reverse quote
    const response = await fetch(
      `${this.evmConfig.baseUrl}/v5.2/${evmChain}/quote?fromTokenAddress=${evmToken}&toTokenAddress=${evmToken}&amount=${amount}`,
      {
        headers: {
          'Authorization': `Bearer ${this.evmConfig.apiKey}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get quote: ${response.statusText}`);
    }

    const quote = await response.json() as any;
    return {
      evmToken,
      nearToken,
      evmChain,
      ...quote,
    };
  }

  /**
   * Execute NEAR to EVM swap
   */
  private async executeNearToEvmSwap(params: InitiateNearToEvmParams): Promise<CrossChainSwapResponse> {
    // 1. Initiate cross-chain swap on NEAR
    const swapId = await this.crossChainBridge.initiateNearToEvmSwap(params);

    // 2. Get the swap details
    const swap = await this.crossChainBridge.getSwap(swapId);
    if (!swap) {
      throw new Error('Failed to create swap');
    }

    // 3. Call 1inch API to execute the swap on EVM side
    const evmSwapResponse = await this.executeEvmSwap({
      chainId: params.evmChainId,
      fromToken: params.evmToken,
      toToken: params.evmToken,
      amount: params.amount,
      recipient: params.recipient,
    });

    return {
      swapId,
      status: SwapStatus.Pending,
      estimatedTime: 300, // 5 minutes
      fees: {
        near: '0.001', // 1 mNEAR
        evm: evmSwapResponse.fee || '0.001', // ETH fee
      },
    };
  }

  /**
   * Execute EVM to NEAR swap
   */
  private async executeEvmToNearSwap(params: InitiateNearToEvmParams): Promise<CrossChainSwapResponse> {
    // 1. Execute swap on EVM side first
    const evmSwapResponse = await this.executeEvmSwap({
      chainId: params.evmChainId,
      fromToken: params.evmToken,
      toToken: params.evmToken,
      amount: params.amount,
      recipient: params.recipient,
    });

    // 2. Create escrow on NEAR side
    const escrowId = await this.crossChainEscrow.createEscrow({
      makerAsset: params.nearToken,
      takerAsset: params.evmToken,
      makingAmount: params.amount,
      takingAmount: params.amount,
      timelocks: {
        finalityPeriod: 300, // 5 minutes
        withdrawalPeriod: 3600, // 1 hour
        cancellationPeriod: 1800, // 30 minutes
      },
    });

    return {
      swapId: escrowId,
      status: SwapStatus.Pending,
      estimatedTime: 300, // 5 minutes
      fees: {
        near: '0.001', // 1 mNEAR
        evm: evmSwapResponse.fee || '0.001', // ETH fee
      },
    };
  }

  /**
   * Execute swap on EVM chain using 1inch API
   */
  private async executeEvmSwap(params: {
    chainId: string;
    fromToken: string;
    toToken: string;
    amount: string;
    recipient: string;
  }): Promise<any> {
    // Get swap data from 1inch API
    const swapDataResponse = await fetch(
      `${this.evmConfig.baseUrl}/v5.2/${params.chainId}/swap?fromTokenAddress=${params.fromToken}&toTokenAddress=${params.toToken}&amount=${params.amount}&fromAddress=${params.recipient}&slippage=1`,
      {
        headers: {
          'Authorization': `Bearer ${this.evmConfig.apiKey}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!swapDataResponse.ok) {
      throw new Error(`Failed to get swap data: ${swapDataResponse.statusText}`);
    }

    const swapData = await swapDataResponse.json();
    return swapData;
  }

  /**
   * Complete a cross-chain swap
   */
  async completeSwap(swapId: string, secret: string, evmTxHash: string): Promise<void> {
    await this.crossChainBridge.completeEvmToNearSwap({
      swapId,
      secret,
      evmTxHash,
    });
  }

  /**
   * Get swap status
   */
  async getSwapStatus(swapId: string): Promise<SwapStatus> {
    const swap = await this.crossChainBridge.getSwap(swapId);
    return swap?.status || SwapStatus.Failed;
  }

  /**
   * Get supported EVM chains
   */
  async getSupportedEvmChains(): Promise<string[]> {
    const chains = await this.crossChainBridge.getSupportedEvmChains();
    return chains.filter(chain => chain.isActive).map(chain => chain.chainId);
  }

  /**
   * Get token list for a specific chain
   */
  async getTokenList(chainId: string): Promise<any[]> {
    const response = await fetch(
      `${this.evmConfig.baseUrl}/v5.2/${chainId}/tokens`,
      {
        headers: {
          'Authorization': `Bearer ${this.evmConfig.apiKey}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get token list: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.tokens || [];
  }

  /**
   * Get gas price for a specific chain
   */
  async getGasPrice(chainId: string): Promise<string> {
    const response = await fetch(
      `${this.evmConfig.baseUrl}/v5.2/${chainId}/gas-price`,
      {
        headers: {
          'Authorization': `Bearer ${this.evmConfig.apiKey}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get gas price: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.fast || '0';
  }
} 