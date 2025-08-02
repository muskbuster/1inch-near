"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrossChainEscrow = void 0;
const near_api_js_1 = require("near-api-js");
class CrossChainEscrow {
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
        this.walletConnection = new near_api_js_1.WalletConnection(near, '1inch-cross-chain-escrow');
        this.accountId = this.walletConnection.getAccountId();
        if (!this.accountId) {
            throw new Error('Please sign in to NEAR wallet');
        }
        this.contract = new near_api_js_1.Contract(this.walletConnection.account(), this.contractId, {
            viewMethods: ['get_escrow'],
            changeMethods: ['create_escrow', 'deposit_into_escrow', 'withdraw_from_escrow', 'cancel_escrow'],
        });
    }
    /**
     * Create a new cross-chain escrow
     */
    async createEscrow(params) {
        if (!this.contract) {
            throw new Error('Contract not initialized. Call initialize() first.');
        }
        const { makerAsset, takerAsset, makingAmount, takingAmount, timelocks, } = params;
        try {
            const result = await this.contract.create_escrow({
                args: {
                    maker_asset: makerAsset,
                    taker_asset: takerAsset,
                    making_amount: makingAmount,
                    taking_amount: takingAmount,
                    maker: this.accountId,
                    timelocks: {
                        finality_period: timelocks.finalityPeriod,
                        withdrawal_period: timelocks.withdrawalPeriod,
                        cancellation_period: timelocks.cancellationPeriod,
                    },
                },
                gas: '300000000000000', // 300 TGas
                attachedDeposit: '1', // 1 yoctoNEAR
            });
            return result;
        }
        catch (error) {
            console.error('Error creating escrow:', error);
            throw new Error(`Failed to create escrow: ${error}`);
        }
    }
    /**
     * Deposit funds into escrow
     */
    async depositIntoEscrow(params) {
        if (!this.contract) {
            throw new Error('Contract not initialized. Call initialize() first.');
        }
        const { escrowId, amount } = params;
        try {
            await this.contract.deposit_into_escrow({
                args: {
                    escrow_id: escrowId,
                    amount: amount,
                },
                gas: '200000000000000', // 200 TGas
                attachedDeposit: '1', // 1 yoctoNEAR
            });
        }
        catch (error) {
            console.error('Error depositing into escrow:', error);
            throw new Error(`Failed to deposit into escrow: ${error}`);
        }
    }
    /**
     * Withdraw from escrow
     */
    async withdrawFromEscrow(params) {
        if (!this.contract) {
            throw new Error('Contract not initialized. Call initialize() first.');
        }
        const { escrowId, secret } = params;
        try {
            await this.contract.withdraw_from_escrow({
                args: {
                    escrow_id: escrowId,
                    secret: secret,
                },
                gas: '200000000000000', // 200 TGas
                attachedDeposit: '1', // 1 yoctoNEAR
            });
        }
        catch (error) {
            console.error('Error withdrawing from escrow:', error);
            throw new Error(`Failed to withdraw from escrow: ${error}`);
        }
    }
    /**
     * Cancel escrow
     */
    async cancelEscrow(escrowId) {
        if (!this.contract) {
            throw new Error('Contract not initialized. Call initialize() first.');
        }
        try {
            await this.contract.cancel_escrow({
                args: {
                    escrow_id: escrowId,
                },
                gas: '100000000000000', // 100 TGas
                attachedDeposit: '1', // 1 yoctoNEAR
            });
        }
        catch (error) {
            console.error('Error canceling escrow:', error);
            throw new Error(`Failed to cancel escrow: ${error}`);
        }
    }
    /**
     * Get escrow by ID
     */
    async getEscrow(escrowId) {
        if (!this.contract) {
            throw new Error('Contract not initialized. Call initialize() first.');
        }
        try {
            const result = await this.contract.get_escrow({
                escrow_id: escrowId,
            });
            if (!result)
                return null;
            return {
                id: result.id,
                maker: result.maker,
                taker: result.taker,
                makerAsset: result.maker_asset,
                takerAsset: result.taker_asset,
                makingAmount: result.making_amount,
                takingAmount: result.taking_amount,
                secretHash: result.secret_hash,
                timelocks: {
                    finalityPeriod: result.timelocks.finality_period,
                    withdrawalPeriod: result.timelocks.withdrawal_period,
                    cancellationPeriod: result.timelocks.cancellation_period,
                },
                status: result.status,
                createdAt: result.created_at,
                fundedAt: result.funded_at,
            };
        }
        catch (error) {
            console.error('Error getting escrow:', error);
            return null;
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
            methodNames: ['create_escrow', 'deposit_into_escrow', 'withdraw_from_escrow', 'cancel_escrow'],
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
exports.CrossChainEscrow = CrossChainEscrow;
//# sourceMappingURL=cross-chain-escrow.js.map