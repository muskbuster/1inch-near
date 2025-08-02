import { connect, keyStores, KeyPair, WalletConnection, Contract } from 'near-api-js';
import {
  Order,
  OrderInfo,
  OrderStatus,
  CreateOrderParams,
  FillOrderParams,
} from './types/limit-order';

export class LimitOrderProtocol {
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
    this.walletConnection = new WalletConnection(near, '1inch-limit-order');
    this.accountId = this.walletConnection.getAccountId();

    if (!this.accountId) {
      throw new Error('Please sign in to NEAR wallet');
    }

    this.contract = new Contract(
      this.walletConnection.account(),
      this.contractId,
      {
        viewMethods: ['get_order', 'get_orders_by_maker'],
        changeMethods: ['create_order', 'fill_order', 'cancel_order'],
      }
    );
  }

  /**
   * Create a new limit order
   */
  async createOrder(params: CreateOrderParams): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    const {
      makerAsset,
      takerAsset,
      makingAmount,
      takingAmount,
      expiration,
    } = params;

    try {
      const result = await (this.contract as any).create_order({
        args: {
          maker_asset: makerAsset,
          taker_asset: takerAsset,
          making_amount: makingAmount,
          taking_amount: takingAmount,
          maker: this.accountId,
          expiration: expiration || (Date.now() + 3600000), // 1 hour default
        },
        gas: '300000000000000', // 300 TGas
        attachedDeposit: '1', // 1 yoctoNEAR
      });

      return result;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error(`Failed to create order: ${error}`);
    }
  }

  /**
   * Fill a limit order
   */
  async fillOrder(params: FillOrderParams): Promise<void> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    const { orderId, takerAmount } = params;

    try {
      await (this.contract as any).fill_order({
        args: {
          order_id: orderId,
          taker_amount: takerAmount,
        },
        gas: '300000000000000', // 300 TGas
        attachedDeposit: '1', // 1 yoctoNEAR
      });
    } catch (error) {
      console.error('Error filling order:', error);
      throw new Error(`Failed to fill order: ${error}`);
    }
  }

  /**
   * Cancel a limit order
   */
  async cancelOrder(orderId: string): Promise<void> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      await (this.contract as any).cancel_order({
        args: {
          order_id: orderId,
        },
        gas: '100000000000000', // 100 TGas
        attachedDeposit: '1', // 1 yoctoNEAR
      });
    } catch (error) {
      console.error('Error canceling order:', error);
      throw new Error(`Failed to cancel order: ${error}`);
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<Order | null> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      const result = await (this.contract as any).get_order({
        order_id: orderId,
      });

      if (!result) return null;

      return {
        id: result.id,
        makerAsset: result.maker_asset,
        takerAsset: result.taker_asset,
        makingAmount: result.making_amount,
        takingAmount: result.taking_amount,
        maker: result.maker,
        expiration: result.expiration,
        status: result.status,
        createdAt: result.created_at,
      };
    } catch (error) {
      console.error('Error getting order:', error);
      return null;
    }
  }

  /**
   * Get orders by maker
   */
  async getOrdersByMaker(maker: string): Promise<Order[]> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      const result = await (this.contract as any).get_orders_by_maker({
        maker: maker,
      });

      return result.map((order: any) => ({
        id: order.id,
        makerAsset: order.maker_asset,
        takerAsset: order.taker_asset,
        makingAmount: order.making_amount,
        takingAmount: order.taking_amount,
        maker: order.maker,
        expiration: order.expiration,
        status: order.status,
        createdAt: order.created_at,
      }));
    } catch (error) {
      console.error('Error getting orders by maker:', error);
      return [];
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
      methodNames: ['create_order', 'fill_order', 'cancel_order'],
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

  /**
   * Generate a random salt
   */
  private generateSalt(): string {
    return Math.random().toString(36).substring(2, 15);
  }
} 