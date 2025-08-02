"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEE1inchSDK = void 0;
const limit_order_protocol_1 = require("./limit-order-protocol");
const cross_chain_escrow_1 = require("./cross-chain-escrow");
const solver_registry_1 = require("./solver-registry");
const crypto_1 = require("./utils/crypto");
class TEE1inchSDK {
    constructor(config) {
        this.limitOrderProtocol = new limit_order_protocol_1.LimitOrderProtocol(config.limitOrderProtocolId);
        this.crossChainEscrow = new cross_chain_escrow_1.CrossChainEscrow(config.crossChainEscrowId);
        this.solverRegistry = new solver_registry_1.SolverRegistry(config.solverRegistryId);
    }
    /**
     * Create a complete cross-chain swap using limit orders and escrows
     */
    async createCrossChainSwap(params) {
        // Generate secret for the escrow
        const secret = (0, crypto_1.generateSecret)();
        const secretHash = (0, crypto_1.hashSecret)(secret);
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
    async executeCrossChainSwap(params) {
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
    generateSecret() {
        return (0, crypto_1.generateSecret)();
    }
    /**
     * Hash a secret for escrow operations
     */
    hashSecret(secret) {
        return (0, crypto_1.hashSecret)(secret);
    }
}
exports.TEE1inchSDK = TEE1inchSDK;
//# sourceMappingURL=sdk.js.map