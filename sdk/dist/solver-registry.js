"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolverRegistry = void 0;
const near_api_js_1 = require("near-api-js");
class SolverRegistry {
    constructor(contractId) {
        this.contract = null;
        this.walletConnection = null;
        this.accountId = null;
        this.contractId = contractId;
    }
    /**
     * Initialize connection to NEAR
     */
    async initialize(network = 'testnet') {
        const config = {
            networkId: network,
            keyStore: new near_api_js_1.keyStores.BrowserLocalStorageKeyStore(),
            nodeUrl: network === 'testnet' ? 'https://rpc.testnet.near.org' : 'https://rpc.mainnet.near.org',
            walletUrl: network === 'testnet' ? 'https://wallet.testnet.near.org' : 'https://wallet.near.org',
            helperUrl: network === 'testnet' ? 'https://helper.testnet.near.org' : 'https://helper.mainnet.near.org',
            explorerUrl: network === 'testnet' ? 'https://explorer.testnet.near.org' : 'https://explorer.mainnet.near.org',
        };
        const near = await (0, near_api_js_1.connect)(config);
        this.walletConnection = new near_api_js_1.WalletConnection(near, '1inch-solver-registry');
        this.accountId = this.walletConnection.getAccountId();
        if (!this.accountId) {
            throw new Error('Please sign in to NEAR wallet');
        }
        this.contract = new near_api_js_1.Contract(this.walletConnection.account(), this.contractId, {
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
        });
    }
    /**
     * Register a worker with TEE verification
     */
    async registerWorker(poolId, quoteHex, collateral, checksum, tcbInfo, solverType) {
        if (!this.contract) {
            throw new Error('Contract not initialized. Call initialize() first.');
        }
        try {
            await this.contract.register_worker({
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
        }
        catch (error) {
            console.error('Error registering worker:', error);
            throw new Error(`Failed to register worker: ${error}`);
        }
    }
    /**
     * Create a new liquidity pool
     */
    async createLiquidityPool(tokenIds, fee) {
        if (!this.contract) {
            throw new Error('Contract not initialized. Call initialize() first.');
        }
        try {
            const result = await this.contract.create_liquidity_pool({
                args: {
                    token_ids: tokenIds,
                    fee: fee,
                },
                gas: '200000000000000', // 200 TGas
                attachedDeposit: '1', // 1 yoctoNEAR
            });
            return result;
        }
        catch (error) {
            console.error('Error creating liquidity pool:', error);
            throw new Error(`Failed to create liquidity pool: ${error}`);
        }
    }
    /**
     * Get pool by ID
     */
    async getPool(poolId) {
        if (!this.contract) {
            throw new Error('Contract not initialized. Call initialize() first.');
        }
        try {
            const result = await this.contract.get_pool({
                pool_id: poolId,
            });
            if (!result)
                return null;
            return {
                id: result.id,
                tokenIds: result.token_ids,
                fee: result.fee,
                totalLiquidity: result.total_liquidity,
                createdAt: result.created_at,
            };
        }
        catch (error) {
            console.error('Error getting pool:', error);
            return null;
        }
    }
    /**
     * Get worker by account ID
     */
    async getWorker(accountId) {
        if (!this.contract) {
            throw new Error('Contract not initialized. Call initialize() first.');
        }
        try {
            const result = await this.contract.get_worker({
                account_id: accountId,
            });
            if (!result)
                return null;
            return {
                accountId: result.account_id,
                poolId: result.pool_id,
                solverType: result.solver_type,
                collateral: result.collateral,
                isActive: result.is_active,
                registeredAt: result.registered_at,
            };
        }
        catch (error) {
            console.error('Error getting worker:', error);
            return null;
        }
    }
    /**
     * Check if a worker has permission for a specific solver type
     */
    async hasSolverPermission(workerId, solverType) {
        if (!this.contract) {
            throw new Error('Contract not initialized. Call initialize() first.');
        }
        try {
            const result = await this.contract.has_solver_permission({
                worker_id: workerId,
                solver_type: solverType,
            });
            return result;
        }
        catch (error) {
            console.error('Error checking solver permission:', error);
            return false;
        }
    }
    /**
     * Get solver permissions for a worker
     */
    async getSolverPermissions(workerId) {
        if (!this.contract) {
            throw new Error('Contract not initialized. Call initialize() first.');
        }
        try {
            const result = await this.contract.get_solver_permissions({
                worker_id: workerId,
            });
            return result;
        }
        catch (error) {
            console.error('Error getting solver permissions:', error);
            return [];
        }
    }
    /**
     * Get limit order protocol contract ID
     */
    async getLimitOrderProtocolId() {
        if (!this.contract) {
            throw new Error('Contract not initialized. Call initialize() first.');
        }
        try {
            const result = await this.contract.get_limit_order_protocol_id();
            return result;
        }
        catch (error) {
            console.error('Error getting limit order protocol ID:', error);
            return '';
        }
    }
    /**
     * Get cross-chain escrow contract ID
     */
    async getCrossChainEscrowId() {
        if (!this.contract) {
            throw new Error('Contract not initialized. Call initialize() first.');
        }
        try {
            const result = await this.contract.get_cross_chain_escrow_id();
            return result;
        }
        catch (error) {
            console.error('Error getting cross-chain escrow ID:', error);
            return '';
        }
    }
    /**
     * Get current account ID
     */
    getAccountId() {
        return this.accountId;
    }
    /**
     * Check if user is signed in
     */
    isSignedIn() {
        return this.walletConnection?.isSignedIn() || false;
    }
    /**
     * Sign in to NEAR wallet
     */
    requestSignIn() {
        this.walletConnection?.requestSignIn({
            contractId: this.contractId,
            methodNames: ['register_worker', 'create_liquidity_pool'],
        });
    }
    /**
     * Sign out from NEAR wallet
     */
    signOut() {
        this.walletConnection?.signOut();
        this.accountId = null;
        this.contract = null;
    }
}
exports.SolverRegistry = SolverRegistry;
//# sourceMappingURL=solver-registry.js.map