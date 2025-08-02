# Quick Start: 1inch Implementation in TEE Solver

## 🚀 Get Started in 5 Minutes

### Option 1: Automated Setup (Recommended)

```bash
# Run the automated setup script
./quick-start.sh
```

### Option 2: Manual Setup

```bash
# 1. Build contracts
make all

# 2. Setup SDK
cd sdk && pnpm install && pnpm run build && cd ..

# 3. Run demo
node demo.js
```

## 📋 What You Get

✅ **Smart Contracts** (Rust for NEAR):
- Limit Order Protocol
- Cross-chain Escrow
- Enhanced Solver Registry
- NEAR Intents integration

✅ **TypeScript SDK**:
- Full type safety
- Easy-to-use API
- Utility functions
- Complete workflow support

✅ **Demo & Tests**:
- Working examples
- Test scripts
- End-to-end workflow

## 🎯 Key Features

### 1. Limit Orders
```typescript
const orderId = await sdk.limitOrderProtocol.createOrder({
  maker_asset: 'usdc.near',
  taker_asset: 'wnear.near',
  making_amount: '1000000000', // 1000 USDC
  taking_amount: '1000000000000000000000000', // 1 NEAR
  maker: 'user.testnet'
});
```

### 2. Cross-chain Swaps
```typescript
const swap = await sdk.createCrossChainSwap({
  makerAsset: 'usdc.near',
  takerAsset: 'wnear.near',
  makingAmount: '1000000000',
  takingAmount: '1000000000000000000000000',
  maker: 'user.testnet',
  taker: 'solver.testnet',
  sourceChain: 'near',
  destinationChain: 'ethereum',
  timelocks: { /* ... */ },
  safetyDeposit: '1000000000000000000000000'
});
```

### 3. TEE Solver Integration
- Secure computation in Trusted Execution Environment
- Multiple solver types (AMM, LimitOrder, CrossChain)
- NEAR Intents for privacy

## 🔧 Prerequisites

- Rust 1.70+
- Node.js 18+
- pnpm
- NEAR CLI
- cargo-near

## 📚 Next Steps

1. **Run the demo**: `node demo.js`
2. **Deploy to testnet**: Follow `SETUP-GUIDE.md`
3. **Explore the code**: Check the contract implementations
4. **Customize**: Modify for your specific needs

## 📖 Documentation

- **Detailed Setup**: `SETUP-GUIDE.md`
- **Implementation Details**: `README-1INCH-IMPLEMENTATION.md`
- **API Reference**: `sdk/README.md`

## 🆘 Need Help?

1. Check the troubleshooting section in `SETUP-GUIDE.md`
2. Run `./quick-start.sh` for automated setup
3. Review the demo script for working examples

---

**🎉 You're ready to go!** The 1inch implementation is now running in your tee-solver with NEAR intents. 