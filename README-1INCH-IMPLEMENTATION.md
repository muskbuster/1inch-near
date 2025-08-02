# 1inch Protocol Implementation in TEE Solver using NEAR Intents

This document describes the implementation of the 1inch protocol (Limit Order Protocol and Cross-chain Swap) in the TEE Solver using NEAR Intents technology.

## Overview

The implementation consists of three main components:

1. **Limit Order Protocol** - Converted from Solidity to Rust for NEAR
2. **Cross-chain Swap Protocol** - Implemented using NEAR Intents escrow functionality
3. **Enhanced Solver Registry** - Extended to support 1inch-style solvers
4. **TypeScript SDK** - Client library for interacting with the protocol

## Architecture

### Smart Contracts

#### 1. Limit Order Protocol (`contracts/limit-order-protocol/`)

**Purpose**: Enables users to create and fill limit orders on NEAR blockchain.

**Key Features**:
- Create limit orders with maker/taker assets and amounts
- Fill orders with partial or complete amounts
- Cancel orders (maker only)
- Support for expiration times and allowed senders
- Integration with NEAR fungible tokens

**Main Functions**:
- `create_order()` - Create a new limit order
- `fill_order()` - Fill an existing order
- `cancel_order()` - Cancel an order
- `get_order()` - Get order details
- `get_orders_by_maker()` - Get all orders by a maker

#### 2. Cross-chain Escrow (`contracts/cross-chain-escrow/`)

**Purpose**: Implements atomic cross-chain swaps using NEAR Intents.

**Key Features**:
- Create escrows for cross-chain swaps
- Deposit funds into escrows using NEAR Intents
- Withdraw funds using secrets (hashlock mechanism)
- Timelock-based cancellation and public withdrawal
- Integration with NEAR Intents for secure fund management

**Main Functions**:
- `create_escrow()` - Create a new cross-chain escrow
- `deposit_into_escrow()` - Deposit funds into escrow
- `withdraw_from_escrow()` - Withdraw funds using secret
- `cancel_escrow()` - Cancel escrow after timelock
- `get_escrow()` - Get escrow details

#### 3. Enhanced Solver Registry (`contracts/solver-registry/`)

**Purpose**: Manages TEE solvers with support for different solver types.

**Key Features**:
- Support for multiple solver types (AMM, LimitOrder, CrossChain)
- TEE verification for solver registration
- Solver permissions management
- Integration with NEAR Intents vault

**New Features**:
- `SolverType` enum for different solver types
- `solver_permissions` mapping for permission management
- Integration with limit order and cross-chain escrow contracts

### TypeScript SDK (`sdk/`)

**Purpose**: Client library for interacting with the 1inch-style protocol.

**Components**:
- `LimitOrderProtocol` - Client for limit order operations
- `CrossChainEscrow` - Client for cross-chain escrow operations
- `SolverRegistry` - Client for solver registry operations
- `TEE1inchSDK` - Main SDK class combining all functionality

**Key Features**:
- Type-safe interfaces for all operations
- Utility functions for crypto operations
- Amount formatting and parsing utilities
- Complete cross-chain swap workflow

## Implementation Details

### 1. Limit Order Protocol Conversion

**From Solidity to Rust**:
- Converted EIP-712 signatures to NEAR account-based authentication
- Replaced ERC20 with NEAR fungible tokens (NEP-141)
- Adapted gas optimization for NEAR's gas model
- Implemented NEAR-specific event emission

**Key Changes**:
```rust
// Solidity: EIP-712 signature verification
// Rust: NEAR account-based authentication
require!(env::predecessor_account_id() == order.maker, "Only maker can cancel");
```

### 2. Cross-chain Swap with NEAR Intents

**Integration with NEAR Intents**:
- Uses NEAR Intents for secure fund management
- Leverages TEE for private computation
- Implements hashlock mechanism for atomic swaps
- Supports timelock-based operations

**Escrow Flow**:
1. User creates escrow with secret hash
2. Funds are deposited into NEAR Intents
3. Solver executes cross-chain swap
4. Secret is revealed to withdraw funds
5. Timelock allows cancellation if needed

### 3. TEE Solver Integration

**Solver Types**:
- `AMM` - Automated Market Maker solvers
- `LimitOrder` - 1inch-style limit order solvers
- `CrossChain` - Cross-chain swap solvers

**TEE Verification**:
- Solver registration requires TEE attestation
- Code hash verification ensures approved solver images
- Public key registration for secure communication

## Usage Examples

### 1. Creating a Limit Order

```typescript
import { TEE1inchSDK } from '@tee-solver/1inch-sdk';

const sdk = new TEE1inchSDK({
  solverRegistryId: 'solver-registry.near',
  limitOrderProtocolId: 'limit-order-protocol.near',
  crossChainEscrowId: 'cross-chain-escrow.near',
});

const orderId = await sdk.limitOrderProtocol.createOrder({
  maker_asset: 'usdc.near',
  taker_asset: 'wnear.near',
  making_amount: '1000000000', // 1000 USDC
  taking_amount: '1000000000000000000000000', // 1 NEAR
  maker: 'user.near',
});
```

### 2. Creating a Cross-chain Swap

```typescript
const swap = await sdk.createCrossChainSwap({
  makerAsset: 'usdc.near',
  takerAsset: 'wnear.near',
  makingAmount: '1000000000',
  takingAmount: '1000000000000000000000000',
  maker: 'user.near',
  taker: 'solver.near',
  sourceChain: 'near',
  destinationChain: 'ethereum',
  timelocks: {
    finality: 60000, // 1 minute
    withdrawal: 300000, // 5 minutes
    public_withdrawal: 600000, // 10 minutes
    cancellation: 900000, // 15 minutes
    public_cancellation: 1200000, // 20 minutes
  },
  safetyDeposit: '1000000000000000000000000', // 1 NEAR
});

console.log('Order ID:', swap.orderId);
console.log('Escrow ID:', swap.escrowId);
console.log('Secret:', swap.secret);
console.log('Secret Hash:', swap.secretHash);
```

### 3. Executing a Cross-chain Swap (Solver)

```typescript
await sdk.executeCrossChainSwap({
  orderId: swap.orderId,
  escrowId: swap.escrowId,
  secret: swap.secret,
  receiver: 'user.near',
});
```

## Security Considerations

### 1. TEE Security
- All solvers run in Trusted Execution Environment
- Code hash verification ensures approved images
- Attestation verification prevents unauthorized solvers

### 2. Cross-chain Security
- Hashlock mechanism ensures atomic swaps
- Timelock periods prevent indefinite locking
- Public withdrawal/cancellation periods for fallback

### 3. NEAR Intents Integration
- Funds are managed securely within NEAR Intents
- TEE ensures private computation
- No direct access to funds without proper authorization

## Deployment

### 1. Build Contracts

```bash
cd tee-solver
make all
```

### 2. Deploy Contracts

```bash
# Deploy Limit Order Protocol
cargo near deploy build-reproducible-wasm limit-order-protocol.near

# Deploy Cross-chain Escrow
cargo near deploy build-reproducible-wasm cross-chain-escrow.near

# Deploy Enhanced Solver Registry
cargo near deploy build-reproducible-wasm solver-registry.near
```

### 3. Initialize Contracts

```bash
# Initialize Solver Registry with contract IDs
near call solver-registry.near new '{
  "owner_id": "owner.near",
  "intents_contract_id": "intents.near",
  "limit_order_protocol_id": "limit-order-protocol.near",
  "cross_chain_escrow_id": "cross-chain-escrow.near"
}' --accountId owner.near
```

## Testing

### 1. Unit Tests

```bash
cd tee-solver
make test
```

### 2. Integration Tests

```bash
cd tee-solver/sdk
npm test
```

## Future Enhancements

1. **Multi-chain Support**: Extend to support multiple blockchains beyond NEAR
2. **Advanced Order Types**: Implement stop-loss, take-profit, and range orders
3. **Liquidity Aggregation**: Aggregate liquidity from multiple sources
4. **MEV Protection**: Implement MEV protection mechanisms
5. **Gas Optimization**: Further optimize gas usage for NEAR

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the 1inch protocol design
- Built on NEAR blockchain technology
- Uses TEE for secure computation
- Integrates with NEAR Intents for privacy 