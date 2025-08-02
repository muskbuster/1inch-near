#!/usr/bin/env node

/**
 * Demo Script for 1inch Implementation in TEE Solver
 * This script demonstrates the key functionality without requiring blockchain deployment
 */

const { TEE1inchSDK } = require('./sdk/dist');

async function runDemo() {
    console.log('🚀 1inch Implementation in TEE Solver - Demo');
    console.log('=============================================\n');

    // Initialize SDK
    const sdk = new TEE1inchSDK({
        solverRegistryId: 'solver-registry.testnet',
        limitOrderProtocolId: 'limit-order-protocol.testnet',
        crossChainEscrowId: 'cross-chain-escrow.testnet',
        networkId: 'testnet'
    });

    try {
        // Demo 1: Limit Order Creation
        console.log('📝 Demo 1: Creating a Limit Order');
        console.log('----------------------------------');
        
        const orderParams = {
            maker_asset: 'usdc.near',
            taker_asset: 'wnear.near',
            making_amount: '1000000000', // 1000 USDC
            taking_amount: '1000000000000000000000000', // 1 NEAR
            maker: 'user.testnet',
            expiration: Date.now() + 3600000 // 1 hour from now
        };

        console.log('Order Parameters:', JSON.stringify(orderParams, null, 2));
        
        const orderId = await sdk.limitOrderProtocol.createOrder(orderParams);
        console.log('✅ Order created with ID:', orderId);
        console.log('');

        // Demo 2: Cross-chain Swap Creation
        console.log('🌉 Demo 2: Creating a Cross-chain Swap');
        console.log('----------------------------------------');
        
        const swapParams = {
            makerAsset: 'usdc.near',
            takerAsset: 'wnear.near',
            makingAmount: '1000000000', // 1000 USDC
            takingAmount: '1000000000000000000000000', // 1 NEAR
            maker: 'user.testnet',
            taker: 'solver.testnet',
            sourceChain: 'near',
            destinationChain: 'ethereum',
            timelocks: {
                finality: 60000, // 1 minute
                withdrawal: 300000, // 5 minutes
                public_withdrawal: 600000, // 10 minutes
                cancellation: 900000, // 15 minutes
                public_cancellation: 1200000, // 20 minutes
            },
            safetyDeposit: '1000000000000000000000000' // 1 NEAR
        };

        console.log('Swap Parameters:', JSON.stringify(swapParams, null, 2));
        
        const swap = await sdk.createCrossChainSwap(swapParams);
        console.log('✅ Cross-chain swap created:');
        console.log('   Order ID:', swap.orderId);
        console.log('   Escrow ID:', swap.escrowId);
        console.log('   Secret:', swap.secret);
        console.log('   Secret Hash:', swap.secretHash);
        console.log('');

        // Demo 3: Cross-chain Swap Execution
        console.log('⚡ Demo 3: Executing Cross-chain Swap');
        console.log('--------------------------------------');
        
        const executionParams = {
            orderId: swap.orderId,
            escrowId: swap.escrowId,
            secret: swap.secret,
            receiver: 'user.testnet'
        };

        console.log('Execution Parameters:', JSON.stringify(executionParams, null, 2));
        
        await sdk.executeCrossChainSwap(executionParams);
        console.log('✅ Cross-chain swap executed successfully');
        console.log('');

        // Demo 4: Utility Functions
        console.log('🔧 Demo 4: Utility Functions');
        console.log('-----------------------------');
        
        // Generate secrets
        const secret1 = sdk.generateSecret();
        const secret2 = sdk.generateSecret();
        const hash1 = sdk.hashSecret(secret1);
        const hash2 = sdk.hashSecret(secret2);
        
        console.log('Generated Secret 1:', secret1);
        console.log('Generated Hash 1:', hash1);
        console.log('Generated Secret 2:', secret2);
        console.log('Generated Hash 2:', hash2);
        console.log('');

        // Demo 5: Amount Formatting
        console.log('💰 Demo 5: Amount Formatting');
        console.log('-----------------------------');
        
        const { formatAmount, parseAmount, nearToYocto, yoctoToNear } = require('./sdk/dist/utils/amounts');
        
        const nearAmount = '1.5';
        const yoctoAmount = nearToYocto(nearAmount);
        const backToNear = yoctoToNear(yoctoAmount);
        
        console.log('NEAR Amount:', nearAmount);
        console.log('YoctoNEAR Amount:', yoctoAmount);
        console.log('Back to NEAR:', backToNear);
        console.log('');

        // Demo 6: Solver Registry Operations
        console.log('🏗️ Demo 6: Solver Registry Operations');
        console.log('--------------------------------------');
        
        const { SolverType } = require('./sdk/dist/types/solver-registry');
        
        console.log('Available Solver Types:');
        console.log('  - AMM:', SolverType.AMM);
        console.log('  - LimitOrder:', SolverType.LimitOrder);
        console.log('  - CrossChain:', SolverType.CrossChain);
        console.log('');

        // Demo 7: Complete Workflow Summary
        console.log('📋 Demo 7: Complete Workflow Summary');
        console.log('------------------------------------');
        
        console.log('1. ✅ User creates limit order');
        console.log('2. ✅ User creates cross-chain escrow');
        console.log('3. ✅ Solver executes the swap');
        console.log('4. ✅ Funds are transferred atomically');
        console.log('5. ✅ TEE ensures privacy and security');
        console.log('');

        console.log('🎉 Demo completed successfully!');
        console.log('');
        console.log('Key Features Demonstrated:');
        console.log('• Limit order creation and management');
        console.log('• Cross-chain atomic swaps');
        console.log('• TEE-based secure computation');
        console.log('• NEAR Intents integration');
        console.log('• Hashlock mechanism for atomicity');
        console.log('• Timelock-based security');
        console.log('• TypeScript SDK with full type safety');
        console.log('');
        console.log('For production deployment, follow the SETUP-GUIDE.md');

    } catch (error) {
        console.error('❌ Demo failed:', error);
        process.exit(1);
    }
}

// Run the demo
if (require.main === module) {
    runDemo().catch(console.error);
}

module.exports = { runDemo }; 