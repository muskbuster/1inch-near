"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OneInchNearSDK = exports.verifySecret = exports.hashSecret = exports.generateSecret = exports.yoctoToNear = exports.nearToYocto = exports.parseAmount = exports.formatAmount = exports.SolverRegistry = exports.CrossChainEscrow = exports.LimitOrderProtocol = void 0;
// Import main SDK classes
const limit_order_protocol_1 = require("./limit-order-protocol");
const cross_chain_escrow_1 = require("./cross-chain-escrow");
const solver_registry_1 = require("./solver-registry");
// Export main SDK classes
var limit_order_protocol_2 = require("./limit-order-protocol");
Object.defineProperty(exports, "LimitOrderProtocol", { enumerable: true, get: function () { return limit_order_protocol_2.LimitOrderProtocol; } });
var cross_chain_escrow_2 = require("./cross-chain-escrow");
Object.defineProperty(exports, "CrossChainEscrow", { enumerable: true, get: function () { return cross_chain_escrow_2.CrossChainEscrow; } });
var solver_registry_2 = require("./solver-registry");
Object.defineProperty(exports, "SolverRegistry", { enumerable: true, get: function () { return solver_registry_2.SolverRegistry; } });
// Export utilities
var amounts_1 = require("./utils/amounts");
Object.defineProperty(exports, "formatAmount", { enumerable: true, get: function () { return amounts_1.formatAmount; } });
Object.defineProperty(exports, "parseAmount", { enumerable: true, get: function () { return amounts_1.parseAmount; } });
Object.defineProperty(exports, "nearToYocto", { enumerable: true, get: function () { return amounts_1.nearToYocto; } });
Object.defineProperty(exports, "yoctoToNear", { enumerable: true, get: function () { return amounts_1.yoctoToNear; } });
var crypto_1 = require("./utils/crypto");
Object.defineProperty(exports, "generateSecret", { enumerable: true, get: function () { return crypto_1.generateSecret; } });
Object.defineProperty(exports, "hashSecret", { enumerable: true, get: function () { return crypto_1.hashSecret; } });
Object.defineProperty(exports, "verifySecret", { enumerable: true, get: function () { return crypto_1.verifySecret; } });
// Main SDK class for easy initialization
class OneInchNearSDK {
    constructor(config) {
        this.limitOrder = new limit_order_protocol_1.LimitOrderProtocol(config.limitOrderContractId);
        this.crossChainEscrow = new cross_chain_escrow_1.CrossChainEscrow(config.crossChainEscrowContractId);
        this.solverRegistry = new solver_registry_1.SolverRegistry(config.solverRegistryContractId);
    }
    /**
     * Initialize all contracts
     */
    async initialize(network = 'testnet') {
        await Promise.all([
            this.limitOrder.initialize(network),
            this.crossChainEscrow.initialize(network),
            this.solverRegistry.initialize(network),
        ]);
    }
    /**
     * Check if user is signed in to all contracts
     */
    isSignedIn() {
        return (this.limitOrder.isSignedIn() &&
            this.crossChainEscrow.isSignedIn() &&
            this.solverRegistry.isSignedIn());
    }
    /**
     * Sign out from all contracts
     */
    signOut() {
        this.limitOrder.signOut();
        this.crossChainEscrow.signOut();
        this.solverRegistry.signOut();
    }
}
exports.OneInchNearSDK = OneInchNearSDK;
//# sourceMappingURL=index.js.map