# ZK Payroll Architecture

## Overview

ZK Payroll is a privacy-preserving payroll system that enables employers to pay salaries and taxes without revealing amounts publicly. This document describes the system architecture and design decisions.

## System Components

### 1. Solana Program (zkpayroll)

The on-chain program written in Rust using the Anchor framework. It handles:

- **Payroll configuration** - Tax rates, authorities, ShadowWire integration
- **Employee management** - Registration, screening, deactivation
- **Payment records** - Metadata storage (no amounts)
- **Proof verification** - Public verification of Bulletproofs

### 2. Frontend (Next.js)

The web application provides:

- **Dashboard** - Overview of payroll stats
- **Employee Management** - Add, view, screen employees
- **Payment Processing** - Step-by-step payment flow
- **Explorer** - Browse and verify payments
- **Settings** - Configure tax rates and compliance

### 3. ShadowWire SDK

Integration with ShadowWire for:

- **Confidential accounts** - Encrypted balance management
- **Bulletproof generation** - Zero-knowledge proofs for amounts
- **Transfer execution** - Hidden amount transfers

### 4. Range API

Compliance integration for:

- **Wallet screening** - Risk assessment of addresses
- **AML compliance** - Detection of sanctioned/risky wallets
- **Scoring** - 0-100 risk scores with thresholds

## Data Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           PAYMENT FLOW                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. PREPARATION                                                          │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────┐                 │
│  │ Employer │────▶│ Range API    │────▶│ Check Score  │                 │
│  │ Initiates│     │ Re-screen    │     │ >= 50?       │                 │
│  └──────────┘     └──────────────┘     └──────────────┘                 │
│                                              │                           │
│                                              ▼                           │
│  2. ZK PROOF GENERATION                                                  │
│  ┌──────────────────────────────────────────────────────────┐           │
│  │                    ShadowWire SDK                         │           │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │           │
│  │  │ Tax Amount  │    │ Net Salary  │    │ Bulletproof │  │           │
│  │  │ (Hidden)    │───▶│ (Hidden)    │───▶│ Generation  │  │           │
│  │  └─────────────┘    └─────────────┘    └─────────────┘  │           │
│  └──────────────────────────────────────────────────────────┘           │
│                                              │                           │
│                                              ▼                           │
│  3. ON-CHAIN EXECUTION                                                   │
│  ┌─────────────┐     ┌──────────────┐     ┌──────────────┐              │
│  │ Tax Transfer│────▶│ Salary      │────▶│ Payment     │              │
│  │ (Hidden)    │     │ Transfer    │     │ Record      │              │
│  │             │     │ (Hidden)    │     │ (Metadata)  │              │
│  └─────────────┘     └──────────────┘     └──────────────┘              │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Privacy Guarantees

### Amounts are NEVER Visible

| Stage | Tax Amount | Salary Amount |
|-------|------------|---------------|
| Employer's wallet | ❌ Hidden | ❌ Hidden |
| Transaction | ❌ Hidden | ❌ Hidden |
| On-chain record | ❌ Not stored | ❌ Not stored |
| Employee's wallet | ❌ Hidden | ❌ Hidden |

### What IS Public

- Employee wallet addresses
- Timestamps of payments
- Verification status of proofs
- Screening scores and status

### Cryptographic Approach

1. **Pedersen Commitments** - Salary stored as commitment, not plaintext
2. **Bulletproof Range Proofs** - Prove amounts positive without revealing
3. **Encrypted Balances** - ShadowWire accounts hide actual balances

## Account Structure

```
                    ┌─────────────────────┐
                    │      PAYROLL        │
                    │  (Per Employer)     │
                    ├─────────────────────┤
                    │ authority: Pubkey   │
                    │ tax_authority       │
                    │ tax_rate_bps: u16   │
                    │ employee_count: u32 │
                    └─────────┬───────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
    │  EMPLOYEE   │    │  EMPLOYEE   │    │  EMPLOYEE   │
    │  (EMP001)   │    │  (EMP002)   │    │  (EMP003)   │
    ├─────────────┤    ├─────────────┤    ├─────────────┤
    │ name        │    │ name        │    │ name        │
    │ wallet      │    │ wallet      │    │ wallet      │
    │ commitment  │    │ commitment  │    │ commitment  │
    │ score: 85   │    │ score: 72   │    │ score: 45   │
    │ is_active   │    │ is_active   │    │ is_active   │
    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
           │                  │                  │
           ▼                  ▼                  ▼
    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
    │  PAYMENT    │    │  PAYMENT    │    │  PAYMENT    │
    │  RECORD     │    │  RECORD     │    │  RECORD     │
    ├─────────────┤    ├─────────────┤    ├─────────────┤
    │ timestamp   │    │ timestamp   │    │ timestamp   │
    │ verified    │    │ verified    │    │ verified    │
    │ NO AMOUNTS! │    │ NO AMOUNTS! │    │ NO AMOUNTS! │
    └─────────────┘    └─────────────┘    └─────────────┘
```

## Security Considerations

### On-Chain Security

- **PDA (Program Derived Addresses)** - All accounts use deterministic addresses
- **Authority checks** - Only employer can modify their payroll
- **Bump seeds** - Stored to prevent PDA collision attacks

### Compliance Security

- **Screening threshold** - Minimum score of 50 required
- **Expiration** - 24-hour re-screening requirement
- **Auto-deactivation** - Low scores disable employees

### Frontend Security

- **Wallet adapter** - Standard Solana wallet connection
- **No key storage** - All signing done via wallet
- **Amount blurring** - UI hides amounts by default

## Integration Points

### ShadowWire Integration

```typescript
// Initialize confidential account
const account = await shadowWire.createAccount(wallet);

// Deposit funds
await shadowWire.deposit(wallet, amount, 'USDC');

// Transfer (amount hidden)
await shadowWire.transfer({
  sender: employer,
  recipient: employee,
  amount: salary,
  type: 'internal', // Uses Bulletproofs
});
```

### Range API Integration

```typescript
// Screen wallet
const result = await range.screen({
  address: walletAddress,
  blockchain: 'solana',
});

// Check score
if (result.score < 50) {
  throw new Error('Wallet screening failed');
}
```

## Future Enhancements

1. **Multi-sig authority** - Require multiple signers for large payments
2. **Scheduled payments** - Automated recurring payroll
3. **Cross-border compliance** - Multi-jurisdiction support
4. **Reporting tools** - Encrypted reports for auditors
5. **Employee portal** - View own payment history
