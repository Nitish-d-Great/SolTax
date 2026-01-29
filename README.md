# ZK Payroll System

A privacy-preserving payroll system built on Solana using zero-knowledge proofs via ShadowWire.

## 🔐 Features

- **Confidential Transfers**: Salary and tax amounts are hidden using Bulletproof ZK proofs
- **Wallet Screening**: Integrated Range API for AML/compliance screening
- **Verifiable Proofs**: Anyone can verify payments without revealing amounts
- **On-chain Privacy**: No sensitive amounts stored on-chain

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ZK Payroll System                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────────┐ │
│  │   Employer  │───▶│  ZK Payroll  │───▶│  ShadowWire SDK   │ │
│  │   Frontend  │    │   Program    │    │  (Bulletproofs)   │ │
│  └─────────────┘    └──────────────┘    └────────────────────┘ │
│        │                   │                      │             │
│        ▼                   ▼                      ▼             │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────────┐ │
│  │  Range API  │    │   On-Chain   │    │   Confidential    │ │
│  │  Screening  │    │   Records    │    │    Transfers      │ │
│  └─────────────┘    │ (No amounts) │    │   (Hidden $$$)    │ │
│                     └──────────────┘    └────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
zkpayroll/
├── programs/zkpayroll/        # Solana program (Anchor)
│   ├── src/
│   │   ├── lib.rs             # Program entry point
│   │   ├── state.rs           # Account structures
│   │   ├── errors.rs          # Error codes
│   │   └── instructions/       # Instruction handlers
│   │       ├── initialize.rs
│   │       ├── add_employee.rs
│   │       ├── process_payment.rs
│   │       ├── verify_proof.rs
│   │       ├── update_screening.rs
│   │       └── deactivate_employee.rs
│   └── Cargo.toml
├── app/                        # Next.js frontend
│   ├── src/
│   │   ├── app/               # Pages
│   │   ├── lib/               # Utilities & clients
│   │   └── providers/         # Context providers
│   └── package.json
├── tests/                      # Integration tests
└── docs/                       # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Rust 1.70+
- Solana CLI 2.0+
- Anchor CLI 0.30+
- Node.js 18+

### Build the Program

```bash
cd zkpayroll
anchor build
```

### Run the Frontend

```bash
cd app
npm install
npm run dev
```

### Deploy to Devnet

```bash
# Ensure you have devnet SOL
solana config set --url devnet
solana airdrop 2

# Deploy
anchor deploy --provider.cluster devnet
```

## 🔒 Privacy Model

### What's Hidden

| Data | Visibility |
|------|------------|
| Salary Amount | ❌ Hidden (Bulletproof) |
| Tax Amount | ❌ Hidden (Bulletproof) |
| Employee Wallet | ✅ Visible |
| Payment Occurred | ✅ Visible |
| Screening Score | ✅ Visible |

### How It Works

1. **Employer deposits** funds into ShadowWire confidential account
2. **On payment**, ZK proofs are generated for tax and salary
3. **Transfers** are sent confidentially - amounts hidden on-chain
4. **Records** store only metadata (who, when) not amounts
5. **Anyone can verify** proof validity without learning amounts

## 🛡️ Compliance

- **Range API Integration**: All employee wallets are screened
- **Configurable Threshold**: Minimum screening score (default: 50)
- **Screening Expiration**: Re-screen required every 24 hours
- **Deactivation**: Low-scoring wallets are auto-deactivated

## 📖 API Reference

### Program Instructions

| Instruction | Description |
|------------|-------------|
| `initialize` | Set up payroll with tax rate & authority |
| `add_employee` | Register employee with screening |
| `process_payment` | Execute confidential payment |
| `verify_proof` | Publicly verify payment proof |
| `update_screening` | Refresh employee risk score |
| `deactivate_employee` | Mark employee as inactive |

### Account Structures

```rust
struct Payroll {
    authority: Pubkey,
    tax_authority: Pubkey,
    tax_rate_bps: u16,       // e.g., 500 = 5%
    shadowwire_program: Pubkey,
    employee_count: u32,
    payment_count: u64,
}

struct Employee {
    payroll: Pubkey,
    employee_id: String,
    name: String,
    wallet: Pubkey,
    salary_commitment: [u8; 32],  // Pedersen commitment
    screening_score: u8,
    is_active: bool,
    confidential_account: Pubkey,
}

struct PaymentRecord {
    employee: Pubkey,
    timestamp: i64,
    verified: bool,
    // NOTE: No amounts stored!
}
```

## 🧪 Testing

```bash
# Run program tests
anchor test

# Run frontend tests
cd app && npm test
```

## 📝 Environment Variables

Create `.env.local` in the `app/` directory:

```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=<your-program-id>
NEXT_PUBLIC_SHADOWWIRE_PROGRAM=<shadowwire-id>
NEXT_PUBLIC_TAX_AUTHORITY_WALLET=<tax-authority>
RANGE_API_KEY=<your-range-api-key>
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [ShadowWire Documentation](https://docs.shadowwire.xyz)
- [Range API Documentation](https://range.org/api)
- [Solana Documentation](https://docs.solana.com)
- [Anchor Framework](https://anchor-lang.com)
