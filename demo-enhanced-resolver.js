const { OneInchNearSDK, EnhancedResolver } = require('./sdk/dist');

// Configuration
const CONFIG = {
  // NEAR Contract IDs (replace with actual deployed contracts)
  limitOrderContractId: 'limit-order-protocol.testnet',
  crossChainEscrowContractId: 'cross-chain-escrow.testnet',
  solverRegistryContractId: 'solver-registry.testnet',
  crossChainBridgeContractId: 'cross-chain-bridge.testnet',
  enhancedResolverContractId: 'enhanced-resolver.testnet',
  
  // 1inch API Configuration
  oneInchApiKey: 'YOUR_1INCH_API_KEY', // Get from https://portal.1inch.dev
  oneInchBaseUrl: 'https://api.1inch.dev',
  
  // Supported EVM Chains
  supportedChains: ['1', '137', '42161', '10'], // Ethereum, Polygon, Arbitrum, Optimism
  
  // Network
  network: 'testnet', // or 'mainnet'
};

// Initialize SDK
const sdk = new OneInchNearSDK({
  limitOrderContractId: CONFIG.limitOrderContractId,
  crossChainEscrowContractId: CONFIG.crossChainEscrowContractId,
  solverRegistryContractId: CONFIG.solverRegistryContractId,
  crossChainBridgeContractId: CONFIG.crossChainBridgeContractId,
  network: CONFIG.network,
});

// Initialize Enhanced Resolver
const enhancedResolver = new EnhancedResolver(CONFIG.enhancedResolverContractId);

async function demoEnhancedResolver() {
  console.log('🚀 Starting 1inch Enhanced Resolver Demo (EVM ↔ EVM through NEAR Intents)\n');

  try {
    // Initialize all contracts
    console.log('📡 Initializing NEAR contracts...');
    await sdk.initialize(CONFIG.network);
    await enhancedResolver.initialize(CONFIG.network);
    console.log('✅ NEAR contracts initialized\n');

    // Check if user is signed in
    if (!sdk.isSignedIn()) {
      console.log('🔐 Please sign in to NEAR wallet...');
      sdk.crossChainBridge.requestSignIn();
      return;
    }

    console.log(`👤 Connected as: ${sdk.crossChainBridge.getAccountId()}\n`);

    // Demo 1: EVM ↔ EVM Swap through NEAR Intents
    await demoEvmToEvmSwap();

    // Demo 2: NEAR Intents-based Swap
    await demoNearIntentSwap();

    // Demo 3: Setup EVM Infrastructure (1inch integration)
    await demoSetupEvmInfrastructure();

    // Demo 4: Get Chain Information
    await demoGetChainInfo();

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

async function demoEvmToEvmSwap() {
  console.log('🔄 Demo: EVM ↔ EVM Swap through NEAR Intents');
  console.log('============================================');

  try {
    // Create NEAR Intents data for EVM to EVM coordination
    const intentData = JSON.stringify({
      type: 'evm_to_evm_swap',
      fromChain: '1', // Ethereum
      toChain: '137', // Polygon
      fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8', // USDC on Ethereum
      toToken: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC on Polygon
      amount: '1000000000', // 1000 USDC (6 decimals)
      recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      timelock: 3600, // 1 hour
      secret: 'demo_secret_123',
    });

    // Execute EVM to EVM swap through NEAR Intents
    console.log('🚀 Executing EVM to EVM swap through NEAR Intents...');
    const swapId = await enhancedResolver.executeEvmToEvmSwap({
      fromChain: '1', // Ethereum
      toChain: '137', // Polygon
      fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8',
      toToken: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      amount: '1000000000',
      recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      intentData,
    });

    console.log('✅ EVM to EVM swap initiated:', {
      swapId,
      fromChain: 'Ethereum',
      toChain: 'Polygon',
      amount: '1000 USDC',
    });

    // Get swap details
    console.log('📊 Getting swap details...');
    const swap = await enhancedResolver.getEvmToEvmSwap(swapId);
    if (swap) {
      console.log('   Swap details:', {
        id: swap.id,
        fromChain: swap.fromChain,
        toChain: swap.toChain,
        status: swap.status,
        createdAt: new Date(swap.createdAt / 1000000).toISOString(),
      });
    }

    // Simulate completing the swap (in real scenario, this would be done by the resolver)
    console.log('🔓 Simulating swap completion...');
    const evmTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const proofData = JSON.stringify({
      merkleRoot: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      merkleProof: ['0xproof1', '0xproof2', '0xproof3'],
      blockNumber: 12345678,
    });

    await enhancedResolver.completeEvmToEvmSwap({
      swapId,
      evmTxHash,
      proofData,
    });

    console.log('✅ EVM to EVM swap completed successfully!');

  } catch (error) {
    console.error('❌ EVM to EVM swap failed:', error.message);
  }

  console.log('\n');
}

async function demoNearIntentSwap() {
  console.log('🔄 Demo: NEAR Intents-based Swap');
  console.log('================================');

  try {
    // Create NEAR Intents data for NEAR to EVM swap
    const intentData = JSON.stringify({
      type: 'near_to_evm_swap',
      sourceChain: 'near',
      destinationChain: '1', // Ethereum
      sourceToken: 'usdc.fakes.testnet',
      destinationToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8',
      amount: '1000000000',
      recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      timelock: 3600,
      secret: 'demo_secret_456',
    });

    // Execute NEAR Intents-based swap
    console.log('🚀 Executing NEAR Intents-based swap...');
    const swapId = await enhancedResolver.executeNearIntentSwap({
      swapType: 'NearToEvm',
      sourceChain: 'near',
      destinationChain: '1', // Ethereum
      sourceToken: 'usdc.fakes.testnet',
      destinationToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8',
      amount: '1000000000',
      recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      intentData,
    });

    console.log('✅ NEAR Intents swap initiated:', {
      swapId,
      swapType: 'NEAR → EVM',
      amount: '1000 USDC',
    });

    // Get swap details
    console.log('📊 Getting swap details...');
    const swap = await enhancedResolver.getNearIntentSwap(swapId);
    if (swap) {
      console.log('   Swap details:', {
        id: swap.id,
        swapType: swap.swapType,
        sourceChain: swap.sourceChain,
        destinationChain: swap.destinationChain,
        status: swap.status,
        createdAt: new Date(swap.createdAt / 1000000).toISOString(),
      });
    }

    // Simulate completing the swap
    console.log('🔓 Simulating swap completion...');
    const completionData = JSON.stringify({
      evmTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      blockNumber: 12345678,
      gasUsed: '150000',
      effectiveGasPrice: '20000000000',
    });

    await enhancedResolver.completeNearIntentSwap({
      swapId,
      completionData,
    });

    console.log('✅ NEAR Intents swap completed successfully!');

  } catch (error) {
    console.error('❌ NEAR Intents swap failed:', error.message);
  }

  console.log('\n');
}

async function demoSetupEvmInfrastructure() {
  console.log('🏗️ Demo: Setup EVM Infrastructure (1inch Integration)');
  console.log('====================================================');

  try {
    // Add supported chains
    console.log('🔗 Adding supported chains...');
    await enhancedResolver.addSupportedChain(
      '1', // Ethereum
      'Ethereum',
      'Evm',
      'https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY',
      true
    );

    await enhancedResolver.addSupportedChain(
      '137', // Polygon
      'Polygon',
      'Evm',
      'https://polygon-rpc.com',
      true
    );

    await enhancedResolver.addSupportedChain(
      '42161', // Arbitrum
      'Arbitrum',
      'Evm',
      'https://arb1.arbitrum.io/rpc',
      true
    );

    console.log('✅ Supported chains added');

    // Add EVM escrow factories (1inch integration)
    console.log('🏭 Adding EVM escrow factories...');
    await enhancedResolver.addEvmEscrowFactory(
      '1', // Ethereum
      '0x1234567890123456789012345678901234567890', // EscrowFactory address
      '0xabcdef1234567890abcdef1234567890abcdef12', // EscrowSrc implementation
      '0xfedcba0987654321fedcba0987654321fedcba09', // EscrowDst implementation
      true
    );

    await enhancedResolver.addEvmEscrowFactory(
      '137', // Polygon
      '0x2345678901234567890123456789012345678901',
      '0xbcdef1234567890abcdef1234567890abcdef123',
      '0xedcba0987654321fedcba0987654321fedcba098',
      true
    );

    console.log('✅ EVM escrow factories added');

    // Add EVM resolvers (1inch integration)
    console.log('🔧 Adding EVM resolvers...');
    await enhancedResolver.addEvmResolver(
      '1', // Ethereum
      '0x3456789012345678901234567890123456789012', // Resolver address
      'CrossChain',
      true
    );

    await enhancedResolver.addEvmResolver(
      '137', // Polygon
      '0x4567890123456789012345678901234567890123',
      'CrossChain',
      true
    );

    console.log('✅ EVM resolvers added');

  } catch (error) {
    console.error('❌ Setup EVM infrastructure failed:', error.message);
  }

  console.log('\n');
}

async function demoGetChainInfo() {
  console.log('🌐 Demo: Get Chain Information');
  console.log('=============================');

  try {
    // Get supported chains
    console.log('🔗 Getting supported chains...');
    const chains = await enhancedResolver.getSupportedChains();
    console.log(`   Found ${chains.length} supported chains:`);
    chains.forEach(chain => {
      console.log(`     - ${chain.chainName} (${chain.chainId}): ${chain.chainType}`);
    });

    // Get EVM escrow factory for Ethereum
    console.log('🏭 Getting EVM escrow factory for Ethereum...');
    const ethereumFactory = await enhancedResolver.getEvmEscrowFactory('1');
    if (ethereumFactory) {
      console.log('   Ethereum escrow factory:', {
        chainId: ethereumFactory.chainId,
        factoryAddress: ethereumFactory.factoryAddress,
        isActive: ethereumFactory.isActive,
      });
    }

    // Get EVM resolver for Ethereum
    console.log('🔧 Getting EVM resolver for Ethereum...');
    const ethereumResolver = await enhancedResolver.getEvmResolver('1');
    if (ethereumResolver) {
      console.log('   Ethereum resolver:', {
        chainId: ethereumResolver.chainId,
        resolverAddress: ethereumResolver.resolverAddress,
        resolverType: ethereumResolver.resolverType,
        isActive: ethereumResolver.isActive,
      });
    }

    // Get EVM escrow factory for Polygon
    console.log('🏭 Getting EVM escrow factory for Polygon...');
    const polygonFactory = await enhancedResolver.getEvmEscrowFactory('137');
    if (polygonFactory) {
      console.log('   Polygon escrow factory:', {
        chainId: polygonFactory.chainId,
        factoryAddress: polygonFactory.factoryAddress,
        isActive: polygonFactory.isActive,
      });
    }

  } catch (error) {
    console.error('❌ Get chain info failed:', error.message);
  }

  console.log('\n');
}

// Run the demo
if (require.main === module) {
  demoEnhancedResolver().then(() => {
    console.log('🎉 Enhanced Resolver Demo completed!');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Enhanced Resolver Demo failed:', error);
    process.exit(1);
  });
}

module.exports = {
  demoEnhancedResolver,
  demoEvmToEvmSwap,
  demoNearIntentSwap,
  demoSetupEvmInfrastructure,
  demoGetChainInfo,
}; 