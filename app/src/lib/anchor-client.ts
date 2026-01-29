import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import idl from './idl.json';

// Program ID - update this after deployment
export const PROGRAM_ID = new PublicKey(
    process.env.NEXT_PUBLIC_PROGRAM_ID || 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS'
);

// ShadowWire Program ID
export const SHADOWWIRE_PROGRAM_ID = new PublicKey(
    process.env.NEXT_PUBLIC_SHADOWWIRE_PROGRAM || '11111111111111111111111111111111'
);

// Tax Authority Wallet
export const TAX_AUTHORITY = new PublicKey(
    process.env.NEXT_PUBLIC_TAX_AUTHORITY_WALLET || '11111111111111111111111111111111'
);

// Create connection
export const getConnection = () => {
    const endpoint = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com';
    return new Connection(endpoint, 'confirmed');
};

// Get program instance
export const getProgram = (provider: AnchorProvider) => {
    return new Program(idl as Idl, provider);
};

// PDA derivation helpers
export const getPayrollPDA = (authority: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('payroll'), authority.toBuffer()],
        PROGRAM_ID
    );
};

export const getEmployeePDA = (
    payroll: PublicKey,
    employeeId: string
): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('employee'), payroll.toBuffer(), Buffer.from(employeeId)],
        PROGRAM_ID
    );
};

export const getPaymentRecordPDA = (
    employee: PublicKey,
    timestamp: number
): [PublicKey, number] => {
    const timestampBuffer = Buffer.alloc(8);
    timestampBuffer.writeBigInt64LE(BigInt(timestamp));

    return PublicKey.findProgramAddressSync(
        [Buffer.from('payment'), employee.toBuffer(), timestampBuffer],
        PROGRAM_ID
    );
};

// Account types (matching on-chain structs)
export interface Payroll {
    authority: PublicKey;
    taxAuthority: PublicKey;
    taxRateBps: number;
    shadowwireProgram: PublicKey;
    bump: number;
    employeeCount: number;
    paymentCount: bigint;
}

export interface Employee {
    payroll: PublicKey;
    employeeId: string;
    name: string;
    wallet: PublicKey;
    salaryCommitment: number[];
    screeningScore: number;
    lastScreened: bigint;
    isActive: boolean;
    confidentialAccount: PublicKey;
    bump: number;
}

export interface PaymentRecord {
    employee: PublicKey;
    timestamp: bigint;
    taxConfidentialAccount: PublicKey;
    employeeConfidentialAccount: PublicKey;
    verified: boolean;
    verifiedAt: bigint;
    verifier: PublicKey;
    bump: number;
}

// Helper to create salary commitment (simplified - in production use actual Pedersen commitment)
export const createSalaryCommitment = (salary: number): number[] => {
    // In production, this would be a proper Pedersen commitment
    // For MVP, we use a simple hash-like representation
    const commitment = new Array(32).fill(0);
    const salaryBytes = Buffer.alloc(8);
    salaryBytes.writeBigUInt64LE(BigInt(salary * 1e6)); // USDC has 6 decimals

    for (let i = 0; i < 8; i++) {
        commitment[i] = salaryBytes[i];
    }

    return commitment;
};
