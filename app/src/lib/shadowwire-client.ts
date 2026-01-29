'use client';

import { ShadowWireClient, TokenUtils, initWASM, isWASMSupported } from '@radr/shadowwire';

type SupportedToken = 'USDC' | 'SOL' | 'RADR' | 'ORE' | 'BONK' | 'JIM' | 'GODL' | 'HUSTLE' | 'ZEC' | 'CRT' | 'BLACKCOIN' | 'GIL' | 'ANON' | 'WLFI' | 'USD1' | 'AOL' | 'IQLABS' | 'SANA' | 'POKI' | 'RAIN' | 'HOSICO' | 'SKR';

// Singleton client
let shadowWireClient: ShadowWireClient | null = null;
let wasmInitialized = true;
let initPromise: Promise<boolean> | null = null;

export interface TransferResult {
    success: boolean;
    transactionId?: string;
    error?: string;
}

export interface BalanceResult {
    balance: number;
    token: string;
}

/**
 * Initialize ShadowWire WASM and client
 * Must be called before any transfers
 */
export async function initializeShadowWire(): Promise<boolean> {
    // Return existing promise if initialization is in progress
    if (initPromise) {
        return initPromise;
    }

    // Already initialized
    if (wasmInitialized && shadowWireClient) {
        return true;
    }

    initPromise = (async () => {
        try {
            console.log('Initializing ShadowWire...');

            // Check WASM support
            if (!isWASMSupported()) {
                console.error('WebAssembly is not supported in this browser');
                return false;
            }

            // Initialize WASM
            console.log('Loading WASM from /wasm/settler_wasm_bg.wasm...');
            await initWASM('/wasm/settler_wasm_bg.wasm');
            console.log('WASM loaded successfully!');

            // Create client
            shadowWireClient = new ShadowWireClient({
                debug: true
            });

            wasmInitialized = true;
            console.log('ShadowWire initialized successfully!');
            return true;
        } catch (error) {
            console.error('Failed to initialize ShadowWire:', error);
            initPromise = null; // Allow retry
            return false;
        }
    })();

    return initPromise;
}

/**
 * Check if ShadowWire is initialized
 */
export function isShadowWireReady(): boolean {
    return wasmInitialized && shadowWireClient !== null;
}

/**
 * Get the ShadowWire client (initialize first if needed)
 */
async function getClient(): Promise<ShadowWireClient> {
    if (!wasmInitialized || !shadowWireClient) {
        const success = await initializeShadowWire();
        if (!success || !shadowWireClient) {
            throw new Error('ShadowWire not initialized');
        }
    }
    return shadowWireClient;
}

/**
 * Get balance from ShadowWire confidential account
 */
export async function getShadowWireBalance(
    walletAddress: string,
    token: SupportedToken = 'SOL'
): Promise<BalanceResult> {
    try {
        const client = await getClient();
        const balance = await client.getBalance(walletAddress, token);
        return {
            balance: typeof balance === 'number' ? balance : parseFloat(balance as any) || 0,
            token
        };
    } catch (error) {
        console.error('Error getting ShadowWire balance:', error);
        return { balance: 0, token };
    }
}

/**
 * Deposit funds into ShadowWire confidential account
 */
export async function depositToShadowWire(
    walletAddress: string,
    amount: number,
    token: SupportedToken = 'SOL'
): Promise<TransferResult> {
    try {
        const client = await getClient();
        const amountSmallest = TokenUtils.toSmallestUnit(amount, token);

        const response = await client.deposit({
            wallet: walletAddress,
            amount: amountSmallest
        });

        return {
            success: true,
            transactionId: (response as any)?.id || (response as any)?.transactionId || 'deposit_success'
        };
    } catch (error) {
        console.error('Deposit error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Deposit failed'
        };
    }
}

/**
 * Execute confidential transfer using ShadowWire
 * This is the core function for private payments
 */
export async function executeConfidentialTransfer(
    senderWallet: string,
    recipientWallet: string,
    amount: number,
    token: SupportedToken = 'SOL',
    signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<TransferResult> {
    try {
        console.log('Executing confidential transfer:');
        console.log('  From:', senderWallet);
        console.log('  To:', recipientWallet);
        console.log('  Amount:', amount, token);

        const client = await getClient();

        // Calculate fee
        const feeBreakdown = client.calculateFee(amount, token);
        console.log('  Fee:', feeBreakdown);

        // Execute internal (private) transfer with ZK proofs
        const result = await client.transfer({
            sender: senderWallet,
            recipient: recipientWallet,
            amount: amount,
            token: token,
            type: 'internal', // Internal = amount hidden with Bulletproof ZK proofs
            wallet: { signMessage }
        });

        console.log('Transfer result:', result);

        return {
            success: true,
            transactionId: (result as any)?.id || (result as any)?.transactionId || 'tx_success'
        };
    } catch (error) {
        console.error('Confidential transfer error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Transfer failed'
        };
    }
}

/**
 * Process salary payment with tax deduction
 * Sends net salary to employee and tax to authority via confidential transfers
 */
export async function processSalaryPayment(
    employerWallet: string,
    employeeWallet: string,
    taxAuthorityWallet: string,
    grossSalary: number,
    taxRate: number,
    token: SupportedToken = 'SOL',
    signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<{
    success: boolean;
    netSalaryTx?: string;
    taxTx?: string;
    error?: string;
}> {
    const taxAmount = grossSalary * taxRate;
    const netSalary = grossSalary - taxAmount;

    console.log('Processing salary payment:');
    console.log('  Gross Salary:', grossSalary, token);
    console.log('  Tax Amount:', taxAmount, token);
    console.log('  Net Salary:', netSalary, token);

    try {
        // Ensure ShadowWire is initialized
        const initialized = await initializeShadowWire();
        if (!initialized) {
            throw new Error('Failed to initialize ShadowWire');
        }

        // Step 1: Send net salary to employee (confidential)
        console.log('Step 1: Sending net salary to employee...');
        const netResult = await executeConfidentialTransfer(
            employerWallet,
            employeeWallet,
            netSalary,
            token,
            signMessage
        );

        if (!netResult.success) {
            throw new Error(`Net salary transfer failed: ${netResult.error}`);
        }
        console.log('Net salary sent! TX:', netResult.transactionId);

        // Step 2: Send tax to tax authority (confidential)
        console.log('Step 2: Sending tax to authority...');
        const taxResult = await executeConfidentialTransfer(
            employerWallet,
            taxAuthorityWallet,
            taxAmount,
            token,
            signMessage
        );

        if (!taxResult.success) {
            throw new Error(`Tax transfer failed: ${taxResult.error}`);
        }
        console.log('Tax sent! TX:', taxResult.transactionId);

        return {
            success: true,
            netSalaryTx: netResult.transactionId,
            taxTx: taxResult.transactionId
        };
    } catch (error) {
        console.error('Salary payment error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Payment processing failed'
        };
    }
}

/**
 * Get fee information for a token
 */
export async function getTokenFeeInfo(token: SupportedToken = 'SOL') {
    try {
        const client = await getClient();
        return {
            feePercentage: client.getFeePercentage(token),
            minimumAmount: client.getMinimumAmount(token),
            token
        };
    } catch {
        // Default fees if not initialized
        return {
            feePercentage: token === 'SOL' ? 0.5 : 1,
            minimumAmount: 0.001,
            token
        };
    }
}

/**
 * Check if wallet has enough balance for payment
 */
export async function checkSufficientBalance(
    walletAddress: string,
    requiredAmount: number,
    token: SupportedToken = 'SOL'
): Promise<boolean> {
    const { balance } = await getShadowWireBalance(walletAddress, token);
    return balance >= requiredAmount;
}

export { shadowWireClient, TokenUtils };
