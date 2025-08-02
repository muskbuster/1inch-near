import { connect, keyStores, KeyPair, WalletConnection, Contract } from 'near-api-js';
import {
  Worker,
  SolverType,
  Pool,
  PoolInfo,
} from './types/solver-registry';

export class SolverRegistry {
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
    this.walletConnection = new WalletConnection(near, '1inch-solver-registry');
    this.accountId = this.walletConnection.getAccountId();

    if (!this.accountId) {
      throw new Error('Please sign in to NEAR wallet');
    }

    this.contract = new Contract(
      this.walletConnection.account(),
      this.contractId,
      {
        viewMethods: [
          'get_pool',
          'get_worker',
          'has_solver_permission',
          'get_solver_permissions',
          'get_limit_order_protocol_id',
          'get_cross_chain_escrow_id',
        ],
        changeMethods: [
          'register_worker',
          'create_liquidity_pool',
        ],
      }
    );
  }

  /**
   * Register a worker with TEE verification
   */
  async registerWorker(
    poolId: number,
    quoteHex: string,
    collateral: string,
    checksum: string,
    tcbInfo: string,
    solverType: SolverType
  ): Promise<void> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      await (this.contract as any).register_worker({
        args: {
          pool_id: poolId,
          quote_hex: quoteHex,
          collateral: collateral,
          checksum: checksum,
          tcb_info: tcbInfo,
          solver_type: solverType,
        },
        gas: '300000000000000', // 300 TGas
        attachedDeposit: '1', // 1 yoctoNEAR
      });
    } catch (error) {
      console.error('Error registering worker:', error);
      throw new Error(`Failed to register worker: ${error}`);
    }
  }

  /**
   * Create a new liquidity pool
   */
  async createLiquidityPool(
    tokenIds: string[],
    fee: number
  ): Promise<number | null> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      const result = await (this.contract as any).create_liquidity_pool({
        args: {
          token_ids: tokenIds,
          fee: fee,
        },
        gas: '200000000000000', // 200 TGas
        attachedDeposit: '1', // 1 yoctoNEAR
      });

      return result;
    } catch (error) {
      console.error('Error creating liquidity pool:', error);
      throw new Error(`Failed to create liquidity pool: ${error}`);
    }
  }

  /**
   * Get pool by ID
   */
  async getPool(poolId: number): Promise<Pool | null> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      const result = await (this.contract as any).get_pool({
        pool_id: poolId,
      });

      if (!result) return null;

      return {
        id: result.id,
        tokenIds: result.token_ids,
        fee: result.fee,
        totalLiquidity: result.total_liquidity,
        createdAt: result.created_at,
      };
    } catch (error) {
      console.error('Error getting pool:', error);
      return null;
    }
  }

  /**
   * Get worker by account ID
   */
  async getWorker(accountId: string): Promise<Worker | null> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      const result = await (this.contract as any).get_worker({
        account_id: accountId,
      });

      if (!result) return null;

      return {
        accountId: result.account_id,
        poolId: result.pool_id,
        solverType: result.solver_type,
        collateral: result.collateral,
        isActive: result.is_active,
        registeredAt: result.registered_at,
      };
    } catch (error) {
      console.error('Error getting worker:', error);
      return null;
    }
  }

  /**
   * Check if a worker has permission for a specific solver type
   */
  async hasSolverPermission(
    workerId: string,
    solverType: SolverType
  ): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      const result = await (this.contract as any).has_solver_permission({
        worker_id: workerId,
        solver_type: solverType,
      });

      return result;
    } catch (error) {
      console.error('Error checking solver permission:', error);
      return false;
    }
  }

  /**
   * Get solver permissions for a worker
   */
  async getSolverPermissions(workerId: string): Promise<SolverType[]> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      const result = await (this.contract as any).get_solver_permissions({
        worker_id: workerId,
      });

      return result;
    } catch (error) {
      console.error('Error getting solver permissions:', error);
      return [];
    }
  }

  /**
   * Get limit order protocol contract ID
   */
  async getLimitOrderProtocolId(): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      const result = await (this.contract as any).get_limit_order_protocol_id();
      return result;
    } catch (error) {
      console.error('Error getting limit order protocol ID:', error);
      return '';
    }
  }

  /**
   * Get cross-chain escrow contract ID
   */
  async getCrossChainEscrowId(): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }

    try {
      const result = await (this.contract as any).get_cross_chain_escrow_id();
      return result;
    } catch (error) {
      console.error('Error getting cross-chain escrow ID:', error);
      return '';
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
      methodNames: ['register_worker', 'create_liquidity_pool'],
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