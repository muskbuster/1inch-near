# End-to-End Setup Guide for 1inch Implementation in TEE Solver

This guide will walk you through setting up and running the complete 1inch implementation in the tee-solver using NEAR intents.

## Prerequisites

### 1. System Requirements
- **Operating System**: Linux, macOS, or Windows with WSL
- **Rust**: Latest stable version (1.70+)
- **Node.js**: Version 18+ 
- **pnpm**: Package manager
- **Docker**: For TEE solver containers
- **NEAR CLI**: For blockchain interaction

### 2. Install Dependencies

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install Node.js (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Install pnpm
npm install -g pnpm

# Install NEAR CLI
npm install -g near-cli

# Install cargo-near
cargo install cargo-near

# Install Docker (if not already installed)
# Follow instructions at: https://docs.docker.com/get-docker/
```

## Step 1: Clone and Setup Repository

```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd tee-solver

# Install Rust dependencies
cargo build

# Install SDK dependencies
cd sdk
pnpm install
cd ..
```

## Step 2: Build Smart Contracts

```bash
# Build all contracts
make all

# This will build:
# - solver-registry
# - intents-vault  
# - limit-order-protocol
# - cross-chain-escrow
# - mock-intents
# - mock-ft

# Verify the WASM files were created
ls -la contracts/*/res/*.wasm
```

## Step 3: Setup NEAR Testnet Environment

```bash
# Login to NEAR testnet
near login

# Create test accounts (you'll need several)
near create-account owner.testnet --masterAccount testnet
near create-account solver-registry.testnet --masterAccount testnet
near create-account limit-order-protocol.testnet --masterAccount testnet
near create-account cross-chain-escrow.testnet --masterAccount testnet
near create-account intents-vault.testnet --masterAccount testnet
near create-account user.testnet --masterAccount testnet
near create-account solver.testnet --masterAccount testnet

# Fund accounts with test NEAR
near send testnet owner.testnet 10
near send testnet solver-registry.testnet 10
near send testnet limit-order-protocol.testnet 10
near send testnet cross-chain-escrow.testnet 10
near send testnet intents-vault.testnet 10
near send testnet user.testnet 10
near send testnet solver.testnet 10
```

## Step 4: Deploy Smart Contracts

```bash
# Deploy Limit Order Protocol
cargo near deploy build-reproducible-wasm limit-order-protocol.testnet \
  --accountId limit-order-protocol.testnet \
  --args '{"owner_id": "owner.testnet", "wnear_contract_id": "wrap.testnet"}'

# Deploy Cross-chain Escrow
cargo near deploy build-reproducible-wasm cross-chain-escrow.testnet \
  --accountId cross-chain-escrow.testnet \
  --args '{"owner_id": "owner.testnet", "intents_contract_id": "intents-vault.testnet", "limit_order_protocol_id": "limit-order-protocol.testnet"}'

# Deploy Intents Vault
cargo near deploy build-reproducible-wasm intents-vault.testnet \
  --accountId intents-vault.testnet

# Deploy Enhanced Solver Registry
cargo near deploy build-reproducible-wasm solver-registry.testnet \
  --accountId solver-registry.testnet \
  --args '{"owner_id": "owner.testnet", "intents_contract_id": "intents-vault.testnet", "limit_order_protocol_id": "limit-order-protocol.testnet", "cross_chain_escrow_id": "cross-chain-escrow.testnet"}'
```

## Step 5: Initialize Contracts

```bash
# Initialize Solver Registry
near call solver-registry.testnet new '{
  "owner_id": "owner.testnet",
  "intents_contract_id": "intents-vault.testnet", 
  "limit_order_protocol_id": "limit-order-protocol.testnet",
  "cross_chain_escrow_id": "cross-chain-escrow.testnet"
}' --accountId owner.testnet

# Initialize Limit Order Protocol
near call limit-order-protocol.testnet new '{
  "owner_id": "owner.testnet",
  "wnear_contract_id": "wrap.testnet"
}' --accountId owner.testnet

# Initialize Cross-chain Escrow
near call cross-chain-escrow.testnet new '{
  "owner_id": "owner.testnet",
  "intents_contract_id": "intents-vault.testnet",
  "limit_order_protocol_id": "limit-order-protocol.testnet"
}' --accountId owner.testnet
```

## Step 6: Setup Mock Tokens (for testing)

```bash
# Deploy mock fungible tokens
cargo near deploy build-reproducible-wasm mock-ft.testnet \
  --accountId mock-ft.testnet \
  --args '{"owner_id": "owner.testnet", "total_supply": "1000000000000000000000000000"}'

# Initialize mock tokens
near call mock-ft.testnet new '{
  "owner_id": "owner.testnet",
  "total_supply": "1000000000000000000000000000"
}' --accountId owner.testnet

# Mint tokens to test accounts
near call mock-ft.testnet mint '{
  "account_id": "user.testnet",
  "amount": "100000000000000000000000000"
}' --accountId owner.testnet

near call mock-ft.testnet mint '{
  "account_id": "solver.testnet", 
  "amount": "100000000000000000000000000"
}' --accountId owner.testnet
```

## Step 7: Build and Test SDK

```bash
# Build the SDK
cd sdk
pnpm run build

# Run tests
pnpm test

cd ..
```

## Step 8: Create Test Script

Create a test script to verify the implementation:

```bash
# Create test directory
mkdir -p tests
cd tests
```

Create `test-1inch-implementation.js`:

```javascript
const { TEE1inchSDK } = require('../sdk/dist');

async function test1inchImplementation() {
  console.log('🚀 Testing 1inch Implementation in TEE Solver...\n');

  // Initialize SDK
  const sdk = new TEE1inchSDK({
    solverRegistryId: 'solver-registry.testnet',
    limitOrderProtocolId: 'limit-order-protocol.testnet',
    crossChainEscrowId: 'cross-chain-escrow.testnet',
    networkId: 'testnet'
  });

  try {
    // Test 1: Create a limit order
    console.log('📝 Test 1: Creating a limit order...');
    const orderId = await sdk.limitOrderProtocol.createOrder({
      maker_asset: 'mock-ft.testnet',
      taker_asset: 'wrap.testnet',
      making_amount: '1000000000000000000000000', // 1 token
      taking_amount: '1000000000000000000000000', // 1 NEAR
      maker: 'user.testnet'
    });
    console.log('✅ Order created with ID:', orderId);

    // Test 2: Create a cross-chain swap
    console.log('\n🌉 Test 2: Creating a cross-chain swap...');
    const swap = await sdk.createCrossChainSwap({
      makerAsset: 'mock-ft.testnet',
      takerAsset: 'wrap.testnet',
      makingAmount: '1000000000000000000000000',
      takingAmount: '1000000000000000000000000',
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
    });
    console.log('✅ Cross-chain swap created:');
    console.log('   Order ID:', swap.orderId);
    console.log('   Escrow ID:', swap.escrowId);
    console.log('   Secret:', swap.secret);
    console.log('   Secret Hash:', swap.secretHash);

    // Test 3: Execute cross-chain swap (simulated)
    console.log('\n⚡ Test 3: Executing cross-chain swap...');
    await sdk.executeCrossChainSwap({
      orderId: swap.orderId,
      escrowId: swap.escrowId,
      secret: swap.secret,
      receiver: 'user.testnet'
    });
    console.log('✅ Cross-chain swap executed successfully');

    // Test 4: Test utility functions
    console.log('\n🔧 Test 4: Testing utility functions...');
    const secret = sdk.generateSecret();
    const hash = sdk.hashSecret(secret);
    console.log('✅ Generated secret:', secret);
    console.log('✅ Generated hash:', hash);

    console.log('\n🎉 All tests passed! 1inch implementation is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
test1inchImplementation().catch(console.error);
```

## Step 9: Run the Test

```bash
# Run the test script
node test-1inch-implementation.js
```

## Step 10: Setup TEE Solver Server (Optional)

For a complete setup with TEE solvers:

```bash
# Setup server environment
cd server
cp .env.example .env

# Edit .env with your configuration
nano .env

# Install server dependencies
pnpm install

# Start the server
pnpm dev
```

## Step 11: Monitor and Debug

### View Contract State
```bash
# Check contract state
near view solver-registry.testnet get_contract_info
near view limit-order-protocol.testnet get_contract_info
near view cross-chain-escrow.testnet get_contract_info
```

### View Events
```bash
# Monitor events
near view solver-registry.testnet get_events
near view limit-order-protocol.testnet get_events
near view cross-chain-escrow.testnet get_events
```

### Check Account Balances
```bash
# Check NEAR balances
near state user.testnet
near state solver.testnet

# Check token balances
near view mock-ft.testnet ft_balance_of '{"account_id": "user.testnet"}'
near view mock-ft.testnet ft_balance_of '{"account_id": "solver.testnet"}'
```

## Troubleshooting

### Common Issues

1. **Contract deployment fails**
   ```bash
   # Check account balance
   near state <account-id>
   
   # Fund account if needed
   near send testnet <account-id> 10
   ```

2. **WASM file not found**
   ```bash
   # Rebuild contracts
   make clean
   make all
   ```

3. **Permission denied errors**
   ```bash
   # Check if you're logged in
   near whoami
   
   # Re-login if needed
   near login
   ```

4. **SDK build errors**
   ```bash
   # Clean and reinstall
   cd sdk
   rm -rf node_modules dist
   pnpm install
   pnpm run build
   ```

### Debug Mode

Enable debug logging:

```bash
# Set environment variable
export NEAR_ENV=testnet
export NEAR_DEBUG=1

# Run with verbose output
near call <contract-id> <method> --verbose
```

## Production Deployment

For production deployment:

1. **Use mainnet accounts**
2. **Deploy to mainnet**
3. **Use real token contracts**
4. **Setup proper TEE infrastructure**
5. **Configure monitoring and alerts**

## Next Steps

1. **Implement actual NEAR wallet integration**
2. **Add comprehensive error handling**
3. **Implement real TEE solver logic**
4. **Add monitoring and analytics**
5. **Optimize gas usage**
6. **Add security audits**

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the contract logs: `near view <contract-id> get_logs`
3. Check NEAR Explorer for transaction details
4. Open an issue in the repository

---

**🎉 Congratulations!** You've successfully set up and run the 1inch implementation in the TEE Solver using NEAR intents. The system is now ready for development and testing. 