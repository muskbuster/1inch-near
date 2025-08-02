import { connect, keyStores, KeyPair, WalletConnection, Contract } from 'near-api-js';
import {
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

export class EnhancedResolver {
  private contractId: string;
  private contract: Contract | null = null;
  private walletConnection: WalletConnection | null = null;
  private accountId: string | null = null;

  constructor(contractId: string) {
    this.contractId = contractId;
  }

  /**
   * Initialize connection to NEAR
   */
  async initialize(network: 'testnet' | 'mainnet' = 'testnet'): Promise<void> {
    const config = {
      networkId: network,
      keyStore: new keyStores.BrowserLocalStorageKeyStore(),
      nodeUrl: network === 'testnet' ? 'https://rpc.testnet.near.org' : 'https://rpc.mainnet.near.org',
      walletUrl: network === 'testnet' ? 'https://wallet.testnet.near.org' : 'https://wallet.near.org',
      helperUrl: network === 'testnet' ? 'https://helper.testnet.near.org' : 'https://helper.mainnet.near.org',
      explorerUrl: network === 'testnet' ? 'https://explorer.testnet.near.org' : 'https://explorer.mainnet.near.org',
    };

    const near = await connect(config);
    this.walletConnection = new WalletConnection(near, '1inch-enhanced-resolver');
    this.accountId = this.walletConnection.getAccountId();

    if (!this.accountId) {
      throw new Error('Please sign in to NEAR wallet');
    }

    this.contract = new Contract(
      this.walletConnection.account(),
      this.contractId,
      {
        viewMethods: [
          'get_evm_to_evm_swap',
          'get_near_intent_swap',
          'get_evm_escrow_factory',
          'get_evm_resolver',
          'get_supported_chains',
        ],
        changeMethods: [
          'execute_evm_to_evm_swap',
          'execute_near_intent_swap',
          'complete_evm_to_evm_swap',
          'complete_near_intent_swap',
          'add_evm_escrow_factory',
          'add_evm_resolver',
          'add_supported_chain',
        ],
      }
    );
  }

  /**
   * Execute EVM ↔ EVM swap through NEAR Intents
   */
  async executeEvmToEvmSwap(params: ExecuteEvmToEvmParams): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    const {
      fromChain,
      toChain,
      fromToken,
      toToken,
      amount,
      recipient,
      intentData,
    } = params;

    try {
      const result = await (this.contract as any).execute_evm_to_evm_swap({
        args: {
          from_chain: fromChain,
          to_chain: toChain,
          from_token: fromToken,
          to_token: toToken,
          amount: amount,
          recipient: recipient,
          intent_data: intentData,
        },
        gas: '300000000000000', // 300 TGas
        attachedDeposit: '1', // 1 yoctoNEAR
      });

      return result;
    } catch (error) {
      console.error('Error executing EVM to EVM swap:', error);
      throw new Error(`Failed to execute EVM to EVM swap: ${error}`);
    }
  }

  /**
   * Execute NEAR Intents-based swap
   */
  async executeNearIntentSwap(params: ExecuteNearIntentParams): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    const {
      swapType,
      sourceChain,
      destinationChain,
      sourceToken,
      destinationToken,
      amount,
      recipient,
      intentData,
    } = params;

    try {
      const result = await (this.contract as any).execute_near_intent_swap({
        args: {
          swap_type: swapType,
          source_chain: sourceChain,
          destination_chain: destinationChain,
          source_token: sourceToken,
          destination_token: destinationToken,
          amount: amount,
          recipient: recipient,
          intent_data: intentData,
        },
        gas: '300000000000000', // 300 TGas
        attachedDeposit: '1', // 1 yoctoNEAR
      });

      return result;
    } catch (error) {
      console.error('Error executing NEAR Intents swap:', error);
      throw new Error(`Failed to execute NEAR Intents swap: ${error}`);
    }
  }

  /**
   * Complete EVM to EVM swap
   */
  async completeEvmToEvmSwap(params: CompleteEvmToEvmParams): Promise<void> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    const { swapId, evmTxHash, proofData } = params;

    try {
      await (this.contract as any).complete_evm_to_evm_swap({
        args: {
          swap_id: swapId,
          evm_tx_hash: evmTxHash,
          proof_data: proofData,
        },
        gas: '200000000000000', // 200 TGas
        attachedDeposit: '1', // 1 yoctoNEAR
      });
    } catch (error) {
      console.error('Error completing EVM to EVM swap:', error);
      throw new Error(`Failed to complete EVM to EVM swap: ${error}`);
    }
  }

  /**
   * Complete NEAR Intents swap
   */
  async completeNearIntentSwap(params: CompleteNearIntentParams): Promise<void> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    const { swapId, completionData } = params;

    try {
      await (this.contract as any).complete_near_intent_swap({
        args: {
          swap_id: swapId,
          completion_data: completionData,
        },
        gas: '200000000000000', // 200 TGas
        attachedDeposit: '1', // 1 yoctoNEAR
      });
    } catch (error) {
      console.error('Error completing NEAR Intents swap:', error);
      throw new Error(`Failed to complete NEAR Intents swap: ${error}`);
    }
  }

  /**
   * Get EVM to EVM swap by ID
   */
  async getEvmToEvmSwap(swapId: string): Promise<EvmToEvmSwap | null> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      const result = await (this.contract as any).get_evm_to_evm_swap({
        swap_id: swapId,
      });

      if (!result) return null;

      return {
        id: result.id,
        fromChain: result.from_chain,
        toChain: result.to_chain,
        fromToken: result.from_token,
        toToken: result.to_token,
        amount: result.amount,
        recipient: result.recipient,
        status: result.status,
        intentData: result.intent_data,
        createdAt: result.created_at,
        completedAt: result.completed_at,
      };
    } catch (error) {
      console.error('Error getting EVM to EVM swap:', error);
      return null;
    }
  }

  /**
   * Get NEAR Intents swap by ID
   */
  async getNearIntentSwap(swapId: string): Promise<NearIntentSwap | null> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      const result = await (this.contract as any).get_near_intent_swap({
        swap_id: swapId,
      });

      if (!result) return null;

      return {
        id: result.id,
        swapType: result.swap_type,
        sourceChain: result.source_chain,
        destinationChain: result.destination_chain,
        sourceToken: result.source_token,
        destinationToken: result.destination_token,
        amount: result.amount,
        recipient: result.recipient,
        status: result.status,
        intentData: result.intent_data,
        createdAt: result.created_at,
        completedAt: result.completed_at,
      };
    } catch (error) {
      console.error('Error getting NEAR Intents swap:', error);
      return null;
    }
  }

  /**
   * Get EVM escrow factory for a chain
   */
  async getEvmEscrowFactory(chainId: string): Promise<EvmEscrowFactoryInfo | null> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      const result = await (this.contract as any).get_evm_escrow_factory({
        chain_id: chainId,
      });

      if (!result) return null;

      return {
        chainId: result.chain_id,
        factoryAddress: result.factory_address,
        escrowSrcImplementation: result.escrow_src_implementation,
        escrowDstImplementation: result.escrow_dst_implementation,
        isActive: result.is_active,
      };
    } catch (error) {
      console.error('Error getting EVM escrow factory:', error);
      return null;
    }
  }

  /**
   * Get EVM resolver for a chain
   */
  async getEvmResolver(chainId: string): Promise<EvmResolverInfo | null> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      const result = await (this.contract as any).get_evm_resolver({
        chain_id: chainId,
      });

      if (!result) return null;

      return {
        chainId: result.chain_id,
        resolverAddress: result.resolver_address,
        resolverType: result.resolver_type,
        isActive: result.is_active,
      };
    } catch (error) {
      console.error('Error getting EVM resolver:', error);
      return null;
    }
  }

  /**
   * Get supported chains
   */
  async getSupportedChains(): Promise<ChainConfig[]> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      const result = await (this.contract as any).get_supported_chains();
      return result.map((chain: any) => ({
        chainId: chain.chain_id,
        chainName: chain.chain_name,
        chainType: chain.chain_type,
        rpcUrl: chain.rpc_url,
        isActive: chain.is_active,
      }));
    } catch (error) {
      console.error('Error getting supported chains:', error);
      return [];
    }
  }

  /**
   * Add EVM escrow factory (owner only)
   */
  async addEvmEscrowFactory(
    chainId: string,
    factoryAddress: string,
    escrowSrcImplementation: string,
    escrowDstImplementation: string,
    isActive: boolean = true
  ): Promise<void> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      await (this.contract as any).add_evm_escrow_factory({
        args: {
          chain_id: chainId,
          factory_address: factoryAddress,
          escrow_src_implementation: escrowSrcImplementation,
          escrow_dst_implementation: escrowDstImplementation,
          is_active: isActive,
        },
        gas: '100000000000000', // 100 TGas
        attachedDeposit: '1', // 1 yoctoNEAR
      });
    } catch (error) {
      console.error('Error adding EVM escrow factory:', error);
      throw new Error(`Failed to add EVM escrow factory: ${error}`);
    }
  }

  /**
   * Add EVM resolver (owner only)
   */
  async addEvmResolver(
    chainId: string,
    resolverAddress: string,
    resolverType: EvmResolverType,
    isActive: boolean = true
  ): Promise<void> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      await (this.contract as any).add_evm_resolver({
        args: {
          chain_id: chainId,
          resolver_address: resolverAddress,
          resolver_type: resolverType,
          is_active: isActive,
        },
        gas: '100000000000000', // 100 TGas
        attachedDeposit: '1', // 1 yoctoNEAR
      });
    } catch (error) {
      console.error('Error adding EVM resolver:', error);
      throw new Error(`Failed to add EVM resolver: ${error}`);
    }
  }

  /**
   * Add supported chain (owner only)
   */
  async addSupportedChain(
    chainId: string,
    chainName: string,
    chainType: ChainType,
    rpcUrl: string,
    isActive: boolean = true
  ): Promise<void> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      await (this.contract as any).add_supported_chain({
        args: {
          chain_id: chainId,
          chain_name: chainName,
          chain_type: chainType,
          rpc_url: rpcUrl,
          is_active: isActive,
        },
        gas: '100000000000000', // 100 TGas
        attachedDeposit: '1', // 1 yoctoNEAR
      });
    } catch (error) {
      console.error('Error adding supported chain:', error);
      throw new Error(`Failed to add supported chain: ${error}`);
    }
  }

  /**
   * Get current account ID
   */
  getAccountId(): string | null {
    return this.accountId;
  }

  /**
   * Check if user is signed in
   */
  isSignedIn(): boolean {
    return this.walletConnection?.isSignedIn() || false;
  }

  /**
   * Sign in to NEAR wallet
   */
  requestSignIn(): void {
    this.walletConnection?.requestSignIn({
      contractId: this.contractId,
      methodNames: [
        'execute_evm_to_evm_swap',
        'execute_near_intent_swap',
        'complete_evm_to_evm_swap',
        'complete_near_intent_swap',
        'add_evm_escrow_factory',
        'add_evm_resolver',
        'add_supported_chain',
      ],
    });
  }

  /**
   * Sign out from NEAR wallet
   */
  signOut(): void {
    this.walletConnection?.signOut();
    this.accountId = null;
    this.contract = null;
  }
} 