import { connect, keyStores, KeyPair, WalletConnection, Contract } from 'near-api-js';
import {
  CrossChainSwap,
  CrossChainSwapInfo,
  EvmChainInfo,
  SwapDirection,
  SwapStatus,
  InitiateNearToEvmParams,
  CompleteEvmToNearParams,
} from './types/cross-chain-bridge';

export class CrossChainBridge {
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
    this.walletConnection = new WalletConnection(near, '1inch-cross-chain-bridge');
    this.accountId = this.walletConnection.getAccountId();

    if (!this.accountId) {
      throw new Error('Please sign in to NEAR wallet');
    }

    this.contract = new Contract(
      this.walletConnection.account(),
      this.contractId,
      {
        viewMethods: [
          'get_swap',
          'get_pending_swaps_by_sender',
          'get_supported_evm_chains',
        ],
        changeMethods: [
          'initiate_near_to_evm_swap',
          'complete_evm_to_near_swap',
          'cancel_swap',
          'add_evm_chain',
        ],
      }
    );
  }

  /**
   * Initiate a cross-chain swap from NEAR to EVM
   */
  async initiateNearToEvmSwap(params: InitiateNearToEvmParams): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    const {
      evmChainId,
      nearToken,
      evmToken,
      amount,
      recipient,
      timelockDuration,
    } = params;

    try {
      const result = await (this.contract as any).initiate_near_to_evm_swap({
        args: {
          evm_chain_id: evmChainId,
          near_token: nearToken,
          evm_token: evmToken,
          amount: amount,
          recipient: recipient,
          timelock_duration: timelockDuration || 3600, // 1 hour default
        },
        gas: '300000000000000', // 300 TGas
        attachedDeposit: '1', // 1 yoctoNEAR
      });

      return result;
    } catch (error) {
      console.error('Error initiating NEAR to EVM swap:', error);
      throw new Error(`Failed to initiate swap: ${error}`);
    }
  }

  /**
   * Complete a cross-chain swap from EVM to NEAR
   */
  async completeEvmToNearSwap(params: CompleteEvmToNearParams): Promise<void> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    const { swapId, secret, evmTxHash } = params;

    try {
      await (this.contract as any).complete_evm_to_near_swap({
        args: {
          swap_id: swapId,
          secret: secret,
          evm_tx_hash: evmTxHash,
        },
        gas: '300000000000000', // 300 TGas
        attachedDeposit: '1', // 1 yoctoNEAR
      });
    } catch (error) {
      console.error('Error completing EVM to NEAR swap:', error);
      throw new Error(`Failed to complete swap: ${error}`);
    }
  }

  /**
   * Cancel a cross-chain swap
   */
  async cancelSwap(swapId: string): Promise<void> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      await (this.contract as any).cancel_swap({
        args: {
          swap_id: swapId,
        },
        gas: '100000000000000', // 100 TGas
        attachedDeposit: '1', // 1 yoctoNEAR
      });
    } catch (error) {
      console.error('Error canceling swap:', error);
      throw new Error(`Failed to cancel swap: ${error}`);
    }
  }

  /**
   * Get swap by ID
   */
  async getSwap(swapId: string): Promise<CrossChainSwap | null> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      const result = await (this.contract as any).get_swap({
        swap_id: swapId,
      });

      if (!result) return null;

      return {
        id: result.id,
        direction: result.direction,
        evmChainId: result.evm_chain_id,
        nearToken: result.near_token,
        evmToken: result.evm_token,
        amount: result.amount,
        sender: result.sender,
        recipient: result.recipient,
        status: result.status,
        secretHash: result.secret_hash,
        timelockDuration: result.timelock_duration,
        createdAt: result.created_at,
        completedAt: result.completed_at,
      };
    } catch (error) {
      console.error('Error getting swap:', error);
      return null;
    }
  }

  /**
   * Get pending swaps by sender
   */
  async getPendingSwapsBySender(sender: string): Promise<CrossChainSwap[]> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      const result = await (this.contract as any).get_pending_swaps_by_sender({
        sender: sender,
      });

      return result.map((swap: any) => ({
        id: swap.id,
        direction: swap.direction,
        evmChainId: swap.evm_chain_id,
        nearToken: swap.near_token,
        evmToken: swap.evm_token,
        amount: swap.amount,
        sender: swap.sender,
        recipient: swap.recipient,
        status: swap.status,
        secretHash: swap.secret_hash,
        timelockDuration: swap.timelock_duration,
        createdAt: swap.created_at,
        completedAt: swap.completed_at,
      }));
    } catch (error) {
      console.error('Error getting pending swaps:', error);
      return [];
    }
  }

  /**
   * Get supported EVM chains
   */
  async getSupportedEvmChains(): Promise<EvmChainInfo[]> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      const result = await (this.contract as any).get_supported_evm_chains();
      return result.map((chain: any) => ({
        chainId: chain.chain_id,
        chainName: chain.chain_name,
        bridgeAddress: chain.bridge_address,
        isActive: chain.is_active,
      }));
    } catch (error) {
      console.error('Error getting supported EVM chains:', error);
      return [];
    }
  }

  /**
   * Add supported EVM chain (owner only)
   */
  async addEvmChain(
    chainId: string,
    chainName: string,
    bridgeAddress: string,
    isActive: boolean = true
  ): Promise<void> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      await (this.contract as any).add_evm_chain({
        args: {
          chain_id: chainId,
          chain_name: chainName,
          bridge_address: bridgeAddress,
          is_active: isActive,
        },
        gas: '100000000000000', // 100 TGas
        attachedDeposit: '1', // 1 yoctoNEAR
      });
    } catch (error) {
      console.error('Error adding EVM chain:', error);
      throw new Error(`Failed to add EVM chain: ${error}`);
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
        'initiate_near_to_evm_swap',
        'complete_evm_to_near_swap',
        'cancel_swap',
        'add_evm_chain',
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