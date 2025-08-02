const { OneInchNearSDK, OneInchIntegration } = require('./sdk/dist');

// Configuration
const CONFIG = {
  // NEAR Contract IDs (replace with actual deployed contracts)
  limitOrderContractId: 'limit-order-protocol.testnet',
  crossChainEscrowContractId: 'cross-chain-escrow.testnet',
  solverRegistryContractId: 'solver-registry.testnet',
  crossChainBridgeContractId: 'cross-chain-bridge.testnet',
  
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

// Initialize 1inch Integration
const oneInchIntegration = new OneInchIntegration(
  sdk.crossChainBridge,
  sdk.limitOrder,
  sdk.crossChainEscrow,
  {
    apiKey: CONFIG.oneInchApiKey,
    baseUrl: CONFIG.oneInchBaseUrl,
    supportedChains: CONFIG.supportedChains,
  }
);

async function demoCrossChainSwaps() {
  console.log('🚀 Starting 1inch NEAR ↔ EVM Cross-Chain Demo\n');

  try {
    // Initialize all contracts
    console.log('📡 Initializing NEAR contracts...');
    await sdk.initialize(CONFIG.network);
    console.log('✅ NEAR contracts initialized\n');

    // Check if user is signed in
    if (!sdk.isSignedIn()) {
      console.log('🔐 Please sign in to NEAR wallet...');
      sdk.crossChainBridge.requestSignIn();
      return;
    }

    console.log(`👤 Connected as: ${sdk.crossChainBridge.getAccountId()}\n`);

    // Demo 1: NEAR to EVM Swap
    await demoNearToEvmSwap();

    // Demo 2: EVM to NEAR Swap
    await demoEvmToNearSwap();

    // Demo 3: Get Quotes
    await demoGetQuotes();

    // Demo 4: Get Supported Chains and Tokens
    await demoGetChainsAndTokens();

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

async function demoNearToEvmSwap() {
  console.log('🔄 Demo: NEAR to EVM Swap');
  console.log('========================');

  try {
    // Get quote for NEAR to EVM swap
    const quote = await oneInchIntegration.getCrossChainQuote({
      fromChain: 'near',
      toChain: '1', // Ethereum
      fromToken: 'usdc.fakes.testnet', // NEAR USDC
      toToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8', // EVM USDC
      amount: '1000000000', // 1000 USDC (6 decimals)
      recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // EVM address
      slippage: 1, // 1%
    });

    console.log('📊 Quote received:', {
      fromAmount: quote.fromTokenAmount,
      toAmount: quote.toTokenAmount,
      estimatedGas: quote.estimatedGas,
      priceImpact: quote.priceImpact,
    });

    // Execute the swap
    console.log('🚀 Executing NEAR to EVM swap...');
    const swapResult = await oneInchIntegration.executeCrossChainSwap({
      fromChain: 'near',
      toChain: '1',
      fromToken: 'usdc.fakes.testnet',
      toToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8',
      amount: '1000000000',
      recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      slippage: 1,
    });

    console.log('✅ Swap initiated:', {
      swapId: swapResult.swapId,
      status: swapResult.status,
      estimatedTime: swapResult.estimatedTime,
      fees: swapResult.fees,
    });

    // Monitor swap status
    console.log('⏳ Monitoring swap status...');
    let status = await oneInchIntegration.getSwapStatus(swapResult.swapId);
    console.log(`📈 Current status: ${status}`);

  } catch (error) {
    console.error('❌ NEAR to EVM swap failed:', error.message);
  }

  console.log('\n');
}

async function demoEvmToNearSwap() {
  console.log('🔄 Demo: EVM to NEAR Swap');
  console.log('========================');

  try {
    // Get quote for EVM to NEAR swap
    const quote = await oneInchIntegration.getCrossChainQuote({
      fromChain: '1', // Ethereum
      toChain: 'near',
      fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8', // EVM USDC
      toToken: 'usdc.fakes.testnet', // NEAR USDC
      amount: '1000000000', // 1000 USDC (6 decimals)
      recipient: 'user.testnet', // NEAR account
      slippage: 1, // 1%
    });

    console.log('📊 Quote received:', {
      fromAmount: quote.fromTokenAmount,
      toAmount: quote.toTokenAmount,
      estimatedGas: quote.estimatedGas,
      priceImpact: quote.priceImpact,
    });

    // Execute the swap
    console.log('🚀 Executing EVM to NEAR swap...');
    const swapResult = await oneInchIntegration.executeCrossChainSwap({
      fromChain: '1',
      toChain: 'near',
      fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8',
      toToken: 'usdc.fakes.testnet',
      amount: '1000000000',
      recipient: 'user.testnet',
      slippage: 1,
    });

    console.log('✅ Swap initiated:', {
      swapId: swapResult.swapId,
      status: swapResult.status,
      estimatedTime: swapResult.estimatedTime,
      fees: swapResult.fees,
    });

    // Simulate completing the swap (in real scenario, this would be done by the resolver)
    console.log('🔓 Simulating swap completion...');
    const secret = 'demo_secret_123';
    const evmTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    
    await oneInchIntegration.completeSwap(swapResult.swapId, secret, evmTxHash);
    console.log('✅ Swap completed successfully!');

  } catch (error) {
    console.error('❌ EVM to NEAR swap failed:', error.message);
  }

  console.log('\n');
}

async function demoGetQuotes() {
  console.log('📊 Demo: Get Cross-Chain Quotes');
  console.log('==============================');

  try {
    // Get quotes for different chains
    const chains = ['1', '137', '42161']; // Ethereum, Polygon, Arbitrum
    const tokens = {
      '1': '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8', // USDC on Ethereum
      '137': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC on Polygon
      '42161': '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // USDC on Arbitrum
    };

    for (const chainId of chains) {
      console.log(`🔗 Getting quote for Ethereum → ${chainId === '1' ? 'Ethereum' : chainId === '137' ? 'Polygon' : 'Arbitrum'}`);
      
      const quote = await oneInchIntegration.getCrossChainQuote({
        fromChain: '1',
        toChain: chainId,
        fromToken: tokens['1'],
        toToken: tokens[chainId],
        amount: '1000000000', // 1000 USDC
        recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      });

      console.log(`   💰 Rate: 1 USDC = ${quote.toTokenAmount / quote.fromTokenAmount} USDC`);
      console.log(`   ⛽ Gas: ${quote.estimatedGas} wei`);
      console.log(`   📈 Price Impact: ${quote.priceImpact}%`);
    }

  } catch (error) {
    console.error('❌ Get quotes failed:', error.message);
  }

  console.log('\n');
}

async function demoGetChainsAndTokens() {
  console.log('🌐 Demo: Get Supported Chains and Tokens');
  console.log('========================================');

  try {
    // Get supported EVM chains
    const supportedChains = await oneInchIntegration.getSupportedEvmChains();
    console.log('🔗 Supported EVM chains:', supportedChains);

    // Get token list for Ethereum
    console.log('🪙 Getting token list for Ethereum...');
    const tokens = await oneInchIntegration.getTokenList('1');
    console.log(`   Found ${tokens.length} tokens on Ethereum`);

    // Show some popular tokens
    const popularTokens = tokens.slice(0, 5);
    console.log('   Popular tokens:');
    popularTokens.forEach(token => {
      console.log(`     - ${token.symbol}: ${token.address}`);
    });

    // Get gas price for Ethereum
    console.log('⛽ Getting gas price for Ethereum...');
    const gasPrice = await oneInchIntegration.getGasPrice('1');
    console.log(`   Fast gas price: ${gasPrice} wei`);

  } catch (error) {
    console.error('❌ Get chains and tokens failed:', error.message);
  }

  console.log('\n');
}

// Run the demo
if (require.main === module) {
  demoCrossChainSwaps().then(() => {
    console.log('🎉 Demo completed!');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Demo failed:', error);
    process.exit(1);
  });
}

module.exports = {
  demoCrossChainSwaps,
  demoNearToEvmSwap,
  demoEvmToNearSwap,
  demoGetQuotes,
  demoGetChainsAndTokens,
}; 