# NEAR Intents TEE Solver Registry with 1inch Integration

The NEAR Intents TEE Solver Registry is a protocol that enables secure and private execution of NEAR Intents solvers using Trusted Execution Environment (TEE) technology. This project includes a complete 1inch protocol implementation (Limit Order Protocol and Cross-chain Escrow) integrated with NEAR Intents for cross-chain atomic swaps.

This protocol allows liquidity pools creation for NEAR Intents. Liquidity providers can transfer funds into the pools' smart contracts. Only the solvers who're running within TEE with the approved Docker images can be registered and authorized to operate against the pools' assets.

## 🚀 1inch Implementation Features

- **Limit Order Protocol**: Complete NEAR implementation of 1inch's limit order functionality
- **Cross-chain Escrow**: Atomic swap mechanism for NEAR ↔ EVM chains
- **TypeScript SDK**: Full client-side library with type safety
- **Docker Build System**: Cross-platform compilation for Apple Silicon and x86_64
- **Automated Deployment**: Scripts for NEAR testnet and EVM testnet deployment
- **Comprehensive Testing**: End-to-end testing framework

## Overview

The system consists of several main components:

1. **Smart Contracts**
   - `solver-registry`: Support liquidity pools creation. Manage registration and verification of TEE solvers for each liquidity pool.
   - `intents-vault`: The vault contract that manage the pool's asset within NEAR Intents.
   - `limit-order-protocol`: 1inch Limit Order Protocol implementation for NEAR
   - `cross-chain-escrow`: Cross-chain atomic swap escrow contract

2. **Solver Management Server**
   - A TypeScript-based server that manages the lifecycle of TEE solvers
   - Handles solver deployment and monitoring for each liquidity pool

3. **TypeScript SDK**
   - Client-side library for interacting with all contracts
   - Full type safety and comprehensive error handling

## Prerequisites

- Rust and Cargo (latest stable version)
- Node.js (v20 or later)
- pnpm package manager
- Docker and Docker Compose
- NEAR CLI
- A NEAR account with sufficient NEAR tokens for funding the ephemeral accounts in each TEE solver

## Project Structure

```
tee-solver/
├── contracts/                    # Smart contracts
│   ├── solver-registry/         # Solver registry contract
│   ├── intents-vault/           # NEAR Intents vault contract
│   ├── mock-intents/            # Mock NEAR Intents contract for testing
│   ├── mock-ft/                 # Mock fungible token for testing
│   ├── limit-order-protocol/    # 1inch Limit Order Protocol
│   └── cross-chain-escrow/      # Cross-chain atomic swap escrow
├── sdk/                         # TypeScript SDK
│   ├── src/                     # Source code
│   ├── dist/                    # Compiled JavaScript
│   └── package.json             # SDK dependencies
├── server/                      # TEE Solver management server
├── scripts/                     # Deployment and utility scripts
├── demo.js                      # Demo script for testing
├── quick-start.sh               # Quick setup script
└── docs/                        # Documentation
```

## 🐳 Docker Compilation Setup

### Apple Silicon (M1/M2) Users

Due to WASM compilation issues on Apple Silicon, we use Docker for consistent builds:

```bash
# Build all contracts using Docker
docker run --rm -v $(pwd):/code -w /code --platform=linux/amd64 rust:1.86.0 bash -c "
rustup target add wasm32-unknown-unknown && 
cargo clean && 
cargo build --target wasm32-unknown-unknown --release -p limit-order-protocol &&
cargo build --target wasm32-unknown-unknown --release -p cross-chain-escrow &&
cargo build --target wasm32-unknown-unknown --release -p solver-registry
"
```

### x86_64 Users

```bash
# Standard compilation
rustup target add wasm32-unknown-unknown
cargo build --target wasm32-unknown-unknown --release
```

### Build Individual Contracts

```bash
# Build Limit Order Protocol
docker run --rm -v $(pwd):/code -w /code --platform=linux/amd64 rust:1.86.0 bash -c "
rustup target add wasm32-unknown-unknown && 
cargo build --target wasm32-unknown-unknown --release -p limit-order-protocol
"

# Build Cross-chain Escrow
docker run --rm -v $(pwd):/code -w /code --platform=linux/amd64 rust:1.86.0 bash -c "
rustup target add wasm32-unknown-unknown && 
cargo build --target wasm32-unknown-unknown --release -p cross-chain-escrow
"
```

## 🚀 Deployment Instructions

### 1. NEAR Testnet Deployment

#### Create NEAR Account

```bash
# Create a new NEAR account
near create-account <your-account>.testnet --masterAccount <master-account>.testnet

# Or use existing account
near login
```

#### Deploy Contracts

```bash
# Deploy Limit Order Protocol
near deploy <your-account>.testnet target/wasm32-unknown-unknown/release/limit_order_protocol.wasm

# Initialize the contract
near call <your-account>.testnet new '{"owner_id": "<your-account>.testnet"}' --accountId <your-account>.testnet

# Deploy Cross-chain Escrow
near deploy <your-account>.testnet target/wasm32-unknown-unknown/release/cross_chain_escrow.wasm

# Initialize the contract
near call <your-account>.testnet new '{"owner_id": "<your-account>.testnet"}' --accountId <your-account>.testnet
```

### 2. EVM Testnet Deployment

```bash
# Deploy to Sepolia testnet
npx hardhat deploy --network sepolia

# Deploy to Mumbai testnet
npx hardhat deploy --network mumbai
```

### 3. Automated Deployment

Use the provided deployment script:

```bash
# Make script executable
chmod +x quick-start.sh

# Run automated deployment
./quick-start.sh
```

## ⚠️ Known Issues and Solutions

### 1. NEAR SDK Deserialization Error

**Error**: `CompilationError(PrepareError(Deserialization))`

**Description**: This error occurs during contract initialization on NEAR testnet, affecting all contracts including known-working ones.

**Root Cause**: NEAR SDK v5.14.0 compatibility issue with testnet RPC.

**Solutions**:
- Try downgrading to NEAR SDK v4.x
- Use different RPC endpoints
- Test with mainnet deployment
- Check NEAR CLI version compatibility

**Status**: Under investigation - affects all contracts, not just 1inch implementation.

### 2. Apple Silicon WASM Compilation

**Error**: `relocation R_WASM_MEMORY_ADDR_SLEB cannot be used against symbol ... recompile with -fPIC`

**Description**: WASM cross-compilation fails on Apple Silicon due to architecture differences.

**Solution**: Use Docker compilation (see Docker Compilation Setup above).

### 3. Cargo Lock File Version

**Error**: `error: failed to parse lock file at: /code/Cargo.lock lock file version '4' was found, but this version of Cargo does not understand this lock file`

**Description**: Docker image has outdated Cargo version.

**Solution**: Use `rust:1.86.0` Docker image (already specified in commands above).

### 4. Node Modules Tracking

**Issue**: `node_modules` directory being tracked in git.

**Solution**: Updated `.gitignore` to exclude build artifacts and dependencies.

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
cargo test

# Run specific contract tests
cargo test -p limit-order-protocol
cargo test -p cross-chain-escrow
```

### Integration Tests

```bash
# Test SDK functionality
cd sdk
pnpm test

# Run demo script
node demo.js
```

### End-to-End Testing

```bash
# Deploy to testnet and run integration tests
./scripts/test-integration.sh
```

## 📚 SDK Usage

### Initialize SDK

```javascript
import { LimitOrderProtocol, CrossChainEscrow } from './sdk';

const limitOrder = new LimitOrderProtocol({
  contractId: 'limit-order-protocol.testnet',
  network: 'testnet'
});

const escrow = new CrossChainEscrow({
  contractId: 'cross-chain-escrow.testnet',
  network: 'testnet'
});
```

### Create Limit Order

```javascript
const orderId = await limitOrder.createOrder({
  makerAsset: 'token-a.testnet',
  takerAsset: 'token-b.testnet',
  makingAmount: '1000000000000000000000000', // 1 token
  takingAmount: '2000000000000000000000000', // 2 tokens
  expiration: Date.now() + 3600000 // 1 hour
});
```

### Create Cross-chain Escrow

```javascript
const escrowId = await escrow.createEscrow({
  makerAsset: 'token-a.testnet',
  takerAsset: '0x1234567890123456789012345678901234567890', // EVM address
  makingAmount: '1000000000000000000000000',
  takingAmount: '2000000000000000000000000',
  timelocks: {
    finalityPeriod: 3600,
    withdrawalPeriod: 7200,
    cancellationPeriod: 1800
  }
});
```

## 🔧 Development

### Building Contracts

```bash
# Build all contracts
make all

# Build specific contract
make limit-order-protocol
make cross-chain-escrow
```

### Building SDK

```bash
cd sdk
pnpm install
pnpm build
```

### Running Development Server

```bash
cd server
pnpm install
pnpm dev
```

## 📖 Documentation

- [Quick Start Guide](QUICK-START.md)
- [Setup Guide](SETUP-GUIDE.md)
- [1inch Implementation Details](README-1INCH-IMPLEMENTATION.md)
- [Deployment Status](DEPLOYMENT-STATUS.md)

## 🛠️ Tools

- [cargo-near](https://github.com/near/cargo-near) - NEAR smart contract development toolkit for Rust
- [near CLI](https://near.cli.rs) - Interact with NEAR blockchain from command line
- [NEAR Rust SDK Documentation](https://docs.near.org/sdk/rust/introduction)

## Security

This project uses TEE (Trusted Execution Environment) to ensure secure and private execution of NEAR Intents solvers. The 1inch implementation includes comprehensive security measures for cross-chain atomic swaps.

## Acknowledgement

The project is inspired by the incredible design of [Shade Agent](https://github.com/NearDeFi/shade-agent-template) and the 1inch protocol architecture.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

# 1inch Protocol Implementation on NEAR

A complete implementation of the 1inch protocol on NEAR blockchain, featuring cross-chain swaps, limit orders, and enhanced resolver functionality using NEAR Intents technology.

## 🚀 **Deployed Contracts (NEAR Testnet)**

All contracts have been successfully deployed to NEAR testnet:

| Contract | Address | Transaction ID |
|----------|---------|----------------|
| **Limit Order Protocol** | `limit-order-protocol.testnet` | [ZqhQv8FdtBXMm88CPvdvE9JwWXWSBrXQw1PtoRqUn3G](https://testnet.nearblocks.io/txns/ZqhQv8FdtBXMm88CPvdvE9JwWXWSBrXQw1PtoRqUn3G) |
| **Cross-Chain Bridge** | `cross-chain-bridge.testnet` | [9QZALfnY3YbWPkqXepdwNq6UfW3gmHiLfjougYUUAZ3K](https://testnet.nearblocks.io/txns/9QZALfnY3YbWPkqXepdwNq6UfW3gmHiLfjougYUUAZ3K) |
| **Enhanced Resolver** | `enhanced-resolver.testnet` | [F9f8y175aaqb1QG7J2HTa9yRt878HPJhUBYYL5CTzKyv](https://testnet.nearblocks.io/txns/F9f8y175aaqb1QG7J2HTa9yRt878HPJhUBYYL5CTzKyv) |

### 📋 **Contract Status**
- ✅ **All contracts deployed successfully**
- ✅ **WASM files generated and verified**
- ⚠️ **Initialization pending** (due to NEAR testnet RPC compatibility issue)
- ✅ **SDK ready for integration**

## 🏗️ **Architecture Overview**
