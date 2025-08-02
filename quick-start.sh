#!/bin/bash

# Quick Start Script for 1inch Implementation in TEE Solver
# This script automates the setup process

set -e  # Exit on any error

echo "🚀 Quick Start: 1inch Implementation in TEE Solver"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check Rust
    if ! command -v cargo &> /dev/null; then
        print_error "Rust is not installed. Please install Rust first."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm is not installed. Please install pnpm first."
        exit 1
    fi
    
    # Check NEAR CLI
    if ! command -v near &> /dev/null; then
        print_error "NEAR CLI is not installed. Please install NEAR CLI first."
        exit 1
    fi
    
    # Check cargo-near
    if ! command -v cargo-near &> /dev/null; then
        print_error "cargo-near is not installed. Please install cargo-near first."
        exit 1
    fi
    
    print_success "All dependencies are installed!"
}

# Build contracts
build_contracts() {
    print_status "Building smart contracts..."
    
    if make all; then
        print_success "Contracts built successfully!"
    else
        print_error "Failed to build contracts"
        exit 1
    fi
}

# Setup SDK
setup_sdk() {
    print_status "Setting up SDK..."
    
    cd sdk
    
    if pnpm install; then
        print_success "SDK dependencies installed!"
    else
        print_error "Failed to install SDK dependencies"
        exit 1
    fi
    
    if pnpm run build; then
        print_success "SDK built successfully!"
    else
        print_error "Failed to build SDK"
        exit 1
    fi
    
    cd ..
}

# Create test script
create_test_script() {
    print_status "Creating test script..."
    
    mkdir -p tests
    
    cat > tests/test-1inch-implementation.js << 'EOF'
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
EOF

    print_success "Test script created!"
}

# Main execution
main() {
    echo "Starting setup process..."
    echo ""
    
    check_dependencies
    echo ""
    
    build_contracts
    echo ""
    
    setup_sdk
    echo ""
    
    create_test_script
    echo ""
    
    print_success "Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Follow the detailed setup guide in SETUP-GUIDE.md"
    echo "2. Deploy contracts to NEAR testnet"
    echo "3. Run the test script: node tests/test-1inch-implementation.js"
    echo ""
    echo "For detailed instructions, see: SETUP-GUIDE.md"
}

# Run main function
main "$@" 