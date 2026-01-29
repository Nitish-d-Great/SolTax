# 🔐 ZK Payroll (SolTax)

**Privacy-Preserving Payroll System on Solana with Zero-Knowledge Proofs**

A next-generation payroll solution that enables confidential salary payments while maintaining full tax compliance. Built on Solana using ShadowWire SDK for private transfers and Range Protocol for wallet compliance screening.

![Solana](https://img.shields.io/badge/Solana-black?style=for-the-badge&logo=solana)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

---

## 🎯 Problem Statement

Traditional payroll systems expose sensitive financial information:
- **Employees** can see each other's salaries on public blockchains
- **Competitors** can analyze company compensation strategies
- **Bad actors** can target high earners
- Yet **tax authorities** still need verified payment records

**ZK Payroll solves this** by hiding transaction amounts using zero-knowledge proofs while maintaining cryptographic proof of tax compliance.

---

## ✨ Features

### 🔒 Privacy-First Payments
- **Hidden Amounts**: Salary amounts are encrypted using Bulletproof ZK proofs
- **Confidential Transfers**: Only sender and recipient know the true amounts
- **Public Verifiability**: Tax payments are cryptographically provable without revealing exact figures

### ✅ Compliance & Screening
- **Range Protocol Integration**: Real-time wallet risk assessment
- **Automated Tax Calculation**: 5% tax automatically deducted and sent to tax authority
- **Audit Trail**: All transactions have verifiable on-chain records

### 👥 Employee Management
- **Add/Remove Employees**: Full CRUD operations for employee records
- **Wallet Screening**: Check employee wallets against sanctions lists
- **Salary Configuration**: Set individual salary amounts per employee

### 💰 Payment Processing
- **One-Click Payments**: Process salary with a single transaction
- **Split Payments**: Automatically splits into net salary + tax
- **Wallet Signing**: Secure authentication via Solana wallet

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ZK PAYROLL SYSTEM                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   Frontend   │───▶│   Next.js    │───▶│   Solana     │          │
│  │   (React)    │    │   API Routes │    │   Program    │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│         │                   │                   │                   │
│         ▼                   ▼                   ▼                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   Wallet     │    │   Range      │    │  ShadowWire  │          │
│  │   Adapter    │    │   Protocol   │    │     SDK      │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 16, React, TypeScript | User interface |
| **Styling** | Tailwind CSS, Lucide Icons | Modern UI components |
| **Blockchain** | Solana, Anchor Framework | Smart contract runtime |
| **Privacy** | ShadowWire SDK, Bulletproofs | Zero-knowledge transfers |
| **Compliance** | Range Protocol API | Wallet risk screening |
| **Wallet** | Solana Wallet Adapter | User authentication |

---

## 📁 Project Structure

```
zkpayroll/
├── app/                          # Next.js frontend application
│   ├── src/
│   │   ├── app/                  # App router pages
│   │   │   ├── page.tsx          # Landing page / Dashboard
│   │   │   ├── employees/        # Employee management
│   │   │   ├── payments/         # Payment processing
│   │   │   ├── explorer/         # Transaction explorer
│   │   │   ├── settings/         # App settings
│   │   │   └── api/
│   │   │       └── screen/       # Range API proxy
│   │   ├── components/           # Reusable UI components
│   │   │   └── WalletButton.tsx  # Wallet connection button
│   │   ├── lib/                  # Core business logic
│   │   │   ├── shadowwire-client.ts  # ShadowWire integration
│   │   │   ├── anchor-client.ts      # Solana program client
│   │   │   ├── range-screening.ts    # Range API client
│   │   │   └── idl.json              # Program IDL
│   │   └── providers/            # React context providers
│   │       ├── EmployeeProvider.tsx   # Employee state
│   │       └── WalletProvider.tsx     # Wallet connection
│   ├── public/
│   │   └── wasm/                 # WebAssembly files
│   │       └── settler_wasm_bg.wasm  # ZK proof generator
│   └── package.json
│
├── programs/                     # Solana programs (Anchor)
│   └── zkpayroll/
│       └── src/
│           ├── lib.rs            # Program entry point
│           └── instructions/     # Program instructions
│               ├── initialize.rs     # Initialize payroll
│               ├── add_employee.rs   # Add employee
│               ├── process_payment.rs # Process payment
│               └── update_screening.rs # Update screening
│
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Rust** and Cargo (for Solana programs)
- **Solana CLI** configured for devnet
- **Anchor CLI** for program deployment

### Installation

```bash
# Clone the repository
git clone https://github.com/Nitish-d-Great/SolTax.git
cd SolTax/zkpayroll

# Install frontend dependencies
cd app
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys
```

### Environment Variables

Create `app/.env.local`:

```env
# Solana Program (deployed on devnet)
NEXT_PUBLIC_PROGRAM_ID=APj56TZKsc3mDNBpSik46AtGzQnNKhXG6aTrtciXtRj6

# ShadowWire Program ID
NEXT_PUBLIC_SHADOWWIRE_PROGRAM=SWRwrkzFkALxWj9aBCEnbJCTAfEZthAzuoZNHJBpVGD

# Tax Authority Wallet
NEXT_PUBLIC_TAX_AUTHORITY_WALLET=TAXauth111111111111111111111111111111111

# Solana RPC
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com

# Range API Key (for wallet screening)
RANGE_API_KEY=your_range_api_key_here
```

### Running the App

```bash
# Start development server
cd app
npm run dev

# Open in browser
open http://localhost:3000
```

---

## 🔄 How It Works

### 1. Employee Onboarding

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Add New   │───▶│   Screen     │───▶│   Store     │
│   Employee  │    │   Wallet     │    │   Employee  │
└─────────────┘    └──────────────┘    └─────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │  Range API   │
                   │  Risk Score  │
                   └──────────────┘
```

1. HR enters employee details (name, wallet, salary)
2. System calls Range API to screen wallet
3. If risk score < 50, employee is approved
4. Employee record stored in localStorage

### 2. Payment Processing

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Select    │───▶│  Calculate   │───▶│   Execute   │
│   Employee  │    │  Tax + Net   │    │  Transfers  │
└─────────────┘    └──────────────┘    └─────────────┘
                                              │
                          ┌───────────────────┴───────────────────┐
                          ▼                                       ▼
                   ┌──────────────┐                       ┌──────────────┐
                   │  Net Salary  │                       │     Tax      │
                   │  to Employee │                       │ to Authority │
                   │  (ZK Proof)  │                       │  (ZK Proof)  │
                   └──────────────┘                       └──────────────┘
```

1. User selects employee and initiates payment
2. System re-screens wallet for compliance
3. Calculates: Net = Gross - (Gross × 5%)
4. Executes two ShadowWire confidential transfers:
   - Net salary → Employee wallet
   - Tax amount → Tax authority wallet

### 3. Zero-Knowledge Proof Generation

```
┌─────────────────────────────────────────────────────────────────┐
│                    BULLETPROOF ZK PROOF                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Input: Amount (e.g., 0.95 SOL)                               │
│                                                                 │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │  Generate   │───▶│   Create    │───▶│   Submit    │        │
│   │   Proof     │    │ Commitment  │    │   to Chain  │        │
│   │  (WASM)     │    │             │    │             │        │
│   └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                                 │
│   Output: Transaction with hidden amount, but verifiable       │
│           that amount > 0 and within valid range               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Range Protocol Integration

Range Protocol provides real-time wallet risk assessment for AML/CFT compliance.

### How Range Works

1. **API Request**: Send wallet address to Range API
2. **Risk Analysis**: Range checks against:
   - OFAC sanctions lists
   - Known fraudulent addresses
   - Mixer/tumbler associations
   - Historical transaction patterns
3. **Risk Score**: Returns 0-100 score
   - **0-30**: Low risk (✅ approved)
   - **31-49**: Medium risk (⚠️ approved with caution)
   - **50-100**: High risk (❌ rejected)

### Implementation

```typescript
// app/src/lib/range-screening.ts
export async function screenWallet(address: string): Promise<ScreeningResult> {
    const response = await fetch(`/api/screen?address=${address}`);
    const data = await response.json();
    
    return {
        score: data.risk_score,
        factors: data.risk_factors,
        timestamp: Date.now()
    };
}

export function passesScreening(score: number): boolean {
    return score < 50; // Threshold for approval
}
```

### API Route (Server-Side)

```typescript
// app/src/app/api/screen/route.ts
export async function GET(request: Request) {
    const address = new URL(request.url).searchParams.get('address');
    
    const response = await fetch(
        `https://api.range.org/v1/address?address=${address}&network=solana`,
        { headers: { 'X-API-Key': process.env.RANGE_API_KEY } }
    );
    
    return Response.json(await response.json());
}
```

---

## 🔮 ShadowWire Implementation

ShadowWire enables private transfers on Solana using Bulletproof zero-knowledge proofs.

### Core Concepts

| Concept | Description |
|---------|-------------|
| **Bulletproofs** | ZK proof system for range proofs without trusted setup |
| **Confidential Account** | Special account that holds encrypted balances |
| **Internal Transfer** | Transfer between confidential accounts (hidden amounts) |
| **External Transfer** | Transfer to regular wallet (visible amount) |

### Integration Code

```typescript
// app/src/lib/shadowwire-client.ts

import { ShadowWireClient, initWASM } from '@radr/shadowwire';

// Initialize WASM for client-side proof generation
await initWASM('/wasm/settler_wasm_bg.wasm');

// Create client
const client = new ShadowWireClient({ debug: true });

// Execute confidential transfer
const result = await client.transfer({
    sender: employerWallet,
    recipient: employeeWallet,
    amount: netSalary,
    token: 'SOL',
    type: 'internal', // Hidden amount
    wallet: { signMessage }
});
```

### Transfer Flow

```
1. User signs transaction message
2. WASM generates Bulletproof range proof
3. Proof submitted to ShadowWire program
4. Program verifies proof and executes transfer
5. Transaction recorded on-chain (amount hidden)
```

### Supported Tokens

| Token | Fee | Decimals |
|-------|-----|----------|
| SOL | 0.5% | 9 |
| USDC | 1.0% | 6 |
| RADR | 0.3% | 9 |

---

## 📊 Compliance Features

### Tax Calculation

```typescript
const TAX_RATE = 0.05; // 5%

function calculatePayment(grossSalary: number) {
    const taxAmount = grossSalary * TAX_RATE;
    const netSalary = grossSalary - taxAmount;
    
    return { grossSalary, taxAmount, netSalary };
}
```

### Audit Trail

Every payment generates:
1. **Net Salary Transaction**: Confidential transfer to employee
2. **Tax Transaction**: Confidential transfer to tax authority
3. **Transaction IDs**: Stored for audit purposes

### Verification

Tax authorities can verify:
- ✅ Payment was made (transaction exists)
- ✅ Amount is within valid range (ZK proof)
- ✅ Recipient is the registered tax authority
- ❌ Exact amount (hidden by design)

---

## 🖥️ User Interface

### Dashboard (`/`)
- Overview of payroll statistics
- Quick access to key features
- Recent activity feed

### Employees (`/employees`)
- Employee list with search/filter
- Add new employees with wallet screening
- View screening status and risk scores
- Initiate salary payments

### Payments (`/payments`)
- Step-by-step payment wizard
- Amount breakdown (gross/tax/net)
- Privacy toggle for amount visibility
- Transaction confirmation

### Explorer (`/explorer`)
- View all processed transactions
- Transaction details and status
- Export for tax reporting

---

## 🔧 Development

### Build for Production

```bash
cd app
npm run build
npm start
```

### Run Tests

```bash
# Frontend tests
npm test

# Solana program tests
anchor test
```

### Deploy Solana Program

```bash
# Build program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

---

## 🗺️ Roadmap

- [x] Employee management with localStorage
- [x] Range Protocol wallet screening
- [x] ShadowWire SDK integration
- [x] Basic payment flow
- [ ] Multi-currency support
- [ ] Recurring payments
- [ ] Employee self-service portal
- [ ] Advanced reporting dashboard
- [ ] Mobile app

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **ShadowWire** - Private transfers using Bulletproofs
- **Range Protocol** - Wallet compliance screening
- **Solana Foundation** - High-performance blockchain
- **Anchor Framework** - Solana development framework

---

## 📞 Contact

**Nitish Gupta** - [@Nitish-d-Great](https://github.com/Nitish-d-Great)

Project Link: [https://github.com/Nitish-d-Great/SolTax](https://github.com/Nitish-d-Great/SolTax)

---

<p align="center">Built with ❤️ for the Solana Privacy Hackathon</p>
