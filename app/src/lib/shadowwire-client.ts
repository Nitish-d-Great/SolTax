// ShadowWire SDK wrapper for confidential transfers
// Using @radr/shadowwire SDK

// NOTE: This is a wrapper around the ShadowWire SDK
// In production, ensure proper types are used based on SDK documentation

// Token symbols supported
export type SupportedToken = 'USDC' | 'SOL';

// We'll use a simple interface since ShadowWire SDK types may vary
interface ShadowWireClientConfig {
    debug?: boolean;
    apiBaseUrl?: string;
}

interface TransferParams {
    sender: string;
    recipient: string;
    amount: number;
    token: string;
    type: 'internal' | 'external';
    wallet?: { signMessage: (message: Uint8Array) => Promise<Uint8Array> };
}

interface TransferResult {
    transactionHash?: string;
    success?: boolean;
}

// Mock client for environments where SDK is not available
class MockShadowWireClient {
    private debug: boolean;

    constructor(config?: ShadowWireClientConfig) {
        this.debug = config?.debug ?? false;
    }

    async getBalance(wallet: string, token: string): Promise<number> {
        if (this.debug) console.log('Mock: getBalance', wallet, token);
        // Return mock balance
        return 10000;
    }

    async deposit(params: { wallet: string; amount: number }): Promise<TransferResult> {
        if (this.debug) console.log('Mock: deposit', params);
        return { transactionHash: `mock_deposit_${Date.now()}` };
    }

    async withdraw(params: { wallet: string; amount: number }): Promise<TransferResult> {
        if (this.debug) console.log('Mock: withdraw', params);
        return { transactionHash: `mock_withdraw_${Date.now()}` };
    }

    async transfer(params: TransferParams): Promise<TransferResult> {
        if (this.debug) console.log('Mock: transfer', params);
        return { transactionHash: `mock_transfer_${Date.now()}` };
    }

    getFeePercentage(token: string): number {
        return 0.001; // 0.1% fee
    }

    getMinimumAmount(token: string): number {
        return token === 'SOL' ? 0.01 : 1;
    }
}

// Try to load real SDK, fall back to mock
let ShadowWireClientClass: typeof MockShadowWireClient;
try {
    // Dynamic import to handle cases where SDK might not be installed
    const sdk = require('@radr/shadowwire');
    ShadowWireClientClass = sdk.ShadowWireClient;
} catch {
    console.warn('ShadowWire SDK not available, using mock client');
    ShadowWireClientClass = MockShadowWireClient;
}

// Initialize ShadowWire client
let shadowWireClient: MockShadowWireClient | null = null;

export function getShadowWireClient(): MockShadowWireClient {
    if (!shadowWireClient) {
        shadowWireClient = new ShadowWireClientClass({
            debug: process.env.NODE_ENV === 'development',
        });
    }
    return shadowWireClient;
}

/**
 * Get confidential balance for a wallet
 * @param wallet - Wallet address
 * @param token - Token symbol (USDC, SOL)
 */
export async function getConfidentialBalance(
    wallet: string,
    token: SupportedToken = 'USDC'
): Promise<number> {
    try {
        const client = getShadowWireClient();
        const balance = await client.getBalance(wallet, token);
        // Handle case where balance might be an object
        if (typeof balance === 'object' && balance !== null) {
            return (balance as { amount?: number }).amount ?? 0;
        }
        return typeof balance === 'number' ? balance : 0;
    } catch (error) {
        console.error('Failed to get confidential balance:', error);
        return 0;
    }
}

/**
 * Deposit funds into confidential account
 * @param wallet - Wallet address
 * @param amount - Amount in token units (e.g., 100 = 100 USDC)
 * @param signMessage - Wallet sign message function
 */
export async function depositToConfidential(
    wallet: string,
    amount: number,
    signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
        const client = getShadowWireClient();

        // Convert to smallest unit (USDC has 6 decimals)
        const amountSmallest = Math.floor(amount * 1e6);

        const response = await client.deposit({
            wallet,
            amount: amountSmallest,
        });

        return {
            success: true,
            txHash: response.transactionHash,
        };
    } catch (error) {
        console.error('Deposit failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Withdraw from confidential account to regular SPL account
 */
export async function withdrawFromConfidential(
    wallet: string,
    amount: number,
    signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
        const client = getShadowWireClient();

        const amountSmallest = Math.floor(amount * 1e6);

        const response = await client.withdraw({
            wallet,
            amount: amountSmallest,
        });

        return {
            success: true,
            txHash: response.transactionHash,
        };
    } catch (error) {
        console.error('Withdrawal failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Execute confidential transfer (internal transfer with ZK proofs)
 * This is the core function for payroll - amounts are hidden via Bulletproofs
 */
export async function confidentialTransfer(
    sender: string,
    recipient: string,
    amount: number,
    token: SupportedToken,
    signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
        const client = getShadowWireClient();

        const result = await client.transfer({
            sender,
            recipient,
            amount,
            token,
            type: 'internal', // Internal = amount hidden via ZK proofs
            wallet: { signMessage },
        });

        return {
            success: true,
            txHash: result.transactionHash,
        };
    } catch (error) {
        console.error('Confidential transfer failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Process payroll payment - sends tax and net salary confidentially
 */
export async function processPayrollPayment(
    employerWallet: string,
    employeeWallet: string,
    taxAuthorityWallet: string,
    salary: number,
    taxAmount: number,
    signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<{
    success: boolean;
    taxTxHash?: string;
    salaryTxHash?: string;
    error?: string;
}> {
    // Calculate net salary
    const netSalary = salary - taxAmount;

    // Step 1: Send tax to tax authority (confidential)
    const taxResult = await confidentialTransfer(
        employerWallet,
        taxAuthorityWallet,
        taxAmount,
        'USDC',
        signMessage
    );

    if (!taxResult.success) {
        return {
            success: false,
            error: `Tax payment failed: ${taxResult.error}`,
        };
    }

    // Step 2: Send net salary to employee (confidential)
    const salaryResult = await confidentialTransfer(
        employerWallet,
        employeeWallet,
        netSalary,
        'USDC',
        signMessage
    );

    if (!salaryResult.success) {
        // Note: In production, this should be atomic
        // For now, we return error but tax was already sent
        return {
            success: false,
            taxTxHash: taxResult.txHash,
            error: `Salary payment failed after tax was sent: ${salaryResult.error}`,
        };
    }

    return {
        success: true,
        taxTxHash: taxResult.txHash,
        salaryTxHash: salaryResult.txHash,
    };
}

/**
 * Get fee information for transfers
 */
export function getTransferFee(amount: number, token: SupportedToken): number {
    const client = getShadowWireClient();
    const feePercentage = client.getFeePercentage(token);
    return amount * feePercentage;
}

/**
 * Check if WASM is supported for client-side proof generation
 */
export function isClientSideProofSupported(): boolean {
    if (typeof window === 'undefined') return false;

    try {
        // Check for WebAssembly support
        return typeof WebAssembly === 'object' &&
            typeof WebAssembly.instantiate === 'function';
    } catch {
        return false;
    }
}
