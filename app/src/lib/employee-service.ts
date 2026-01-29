'use client';

import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import {
    PROGRAM_ID,
    SHADOWWIRE_PROGRAM_ID,
    TAX_AUTHORITY,
    getPayrollPDA,
    getEmployeePDA,
    createSalaryCommitment
} from './anchor-client';
import idl from './idl.json';
import type { Idl } from '@coral-xyz/anchor';

export interface EmployeeData {
    id: string;
    name: string;
    wallet: string;
    salary: number;
    screeningScore: number;
    lastScreened: number;
    isActive: boolean;
    confidentialAccount?: string;
}

/**
 * Fetch all employees for a given authority from on-chain
 */
export async function fetchEmployeesOnChain(
    authority: PublicKey,
    connection: Connection
): Promise<EmployeeData[]> {
    try {
        const [payrollPDA] = getPayrollPDA(authority);

        // Use getProgramAccounts to find all Employee accounts for this payroll
        const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
            filters: [
                // Filter by account type discriminator (first 8 bytes)
                // and payroll field
                {
                    memcmp: {
                        offset: 8, // After discriminator
                        bytes: payrollPDA.toBase58(),
                    },
                },
            ],
        });

        const employees: EmployeeData[] = [];

        for (const account of accounts) {
            try {
                // Manual deserialization based on Employee struct layout
                const data = account.account.data;

                // Skip discriminator (8 bytes) and payroll pubkey (32 bytes)
                let offset = 8 + 32;

                // Read employee_id (4 bytes length prefix + string)
                const idLen = data.readUInt32LE(offset);
                offset += 4;
                const id = data.slice(offset, offset + idLen).toString();
                offset += idLen;

                // Read name (4 bytes length prefix + string)
                const nameLen = data.readUInt32LE(offset);
                offset += 4;
                const name = data.slice(offset, offset + nameLen).toString();
                offset += nameLen;

                // Read wallet (32 bytes)
                const wallet = new PublicKey(data.slice(offset, offset + 32)).toBase58();
                offset += 32;

                // Skip salary_commitment (32 bytes)
                offset += 32;

                // Read screening_score (1 byte)
                const screeningScore = data.readUInt8(offset);
                offset += 1;

                // Read last_screened (8 bytes i64)
                const lastScreened = Number(data.readBigInt64LE(offset));
                offset += 8;

                // Read is_active (1 byte bool)
                const isActive = data.readUInt8(offset) === 1;
                offset += 1;

                // Read confidential_account (32 bytes)
                const confidentialAccount = new PublicKey(data.slice(offset, offset + 32)).toBase58();

                employees.push({
                    id,
                    name,
                    wallet,
                    salary: 0, // Salary is hidden in ZK commitment
                    screeningScore,
                    lastScreened,
                    isActive,
                    confidentialAccount,
                });
            } catch (e) {
                console.error('Failed to parse employee account:', e);
            }
        }

        return employees;
    } catch (error) {
        console.error('Error fetching employees:', error);
        return [];
    }
}

/**
 * Check if payroll is initialized for this authority
 */
export async function isPayrollInitialized(
    authority: PublicKey,
    connection: Connection
): Promise<boolean> {
    try {
        const [payrollPDA] = getPayrollPDA(authority);
        const account = await connection.getAccountInfo(payrollPDA);
        return account !== null && account.data.length > 0;
    } catch {
        return false;
    }
}

/**
 * Initialize payroll on-chain (must be called before adding employees)
 */
export async function initializePayrollOnChain(
    provider: AnchorProvider,
    taxRateBps: number = 500 // 5%
): Promise<string> {
    const program = new Program(idl as Idl, provider);
    const authority = provider.wallet.publicKey;
    const [payrollPDA] = getPayrollPDA(authority);

    console.log('Initializing payroll with:');
    console.log('  Payroll PDA:', payrollPDA.toBase58());
    console.log('  Authority:', authority.toBase58());
    console.log('  Tax Authority:', TAX_AUTHORITY.toBase58());
    console.log('  ShadowWire Program:', SHADOWWIRE_PROGRAM_ID.toBase58());
    console.log('  Tax Rate BPS:', taxRateBps);

    const tx = await (program.methods as any)
        .initialize(taxRateBps)
        .accounts({
            payroll: payrollPDA,
            authority: authority,
            taxAuthority: TAX_AUTHORITY,
            shadowwireProgram: SHADOWWIRE_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
        })
        .rpc();

    console.log('Payroll initialized! TX:', tx);
    return tx;
}

/**
 * Add employee on-chain
 */
export async function addEmployeeOnChain(
    provider: AnchorProvider,
    employeeData: {
        id: string;
        name: string;
        wallet: string;
        salary: number;
        screeningScore: number;
    }
): Promise<string> {
    const program = new Program(idl as Idl, provider);
    const authority = provider.wallet.publicKey;

    const [payrollPDA] = getPayrollPDA(authority);
    const [employeePDA] = getEmployeePDA(payrollPDA, employeeData.id);

    // Create salary commitment
    const salaryCommitment = createSalaryCommitment(employeeData.salary);

    // For confidential account, we'll use the employee wallet as placeholder
    // In production, this would be a ShadowWire confidential account
    const employeeWallet = new PublicKey(employeeData.wallet);

    console.log('Adding employee on-chain:');
    console.log('  ID:', employeeData.id);
    console.log('  Name:', employeeData.name);
    console.log('  Wallet:', employeeData.wallet);
    console.log('  Score:', employeeData.screeningScore);

    const tx = await (program.methods as any)
        .addEmployee(
            employeeData.id,
            employeeData.name,
            Buffer.from(salaryCommitment),
            employeeData.screeningScore
        )
        .accounts({
            payroll: payrollPDA,
            employee: employeePDA,
            employeeWallet: employeeWallet,
            confidentialAccount: employeeWallet, // Placeholder
            authority: authority,
            systemProgram: SystemProgram.programId,
        })
        .rpc();

    console.log('Employee added! TX:', tx);
    return tx;
}

/**
 * Update employee screening on-chain
 */
export async function updateScreeningOnChain(
    provider: AnchorProvider,
    employeeId: string,
    newScore: number
): Promise<string> {
    const program = new Program(idl as Idl, provider);
    const authority = provider.wallet.publicKey;

    const [payrollPDA] = getPayrollPDA(authority);
    const [employeePDA] = getEmployeePDA(payrollPDA, employeeId);

    const tx = await (program.methods as any)
        .updateScreening(newScore)
        .accounts({
            payroll: payrollPDA,
            employee: employeePDA,
            authority: authority,
        })
        .rpc();

    return tx;
}
