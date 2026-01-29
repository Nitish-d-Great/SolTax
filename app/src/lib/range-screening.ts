// Range API client for wallet screening
// This client calls the server-side API route which has access to the API key

export interface ScreeningResult {
    address: string;
    score: number; // Legacy 0-100 scale for backward compatibility
    riskScore?: number; // Range API riskScore (1-10 scale, where 10 is highest risk)
    riskLevel: 'low' | 'medium' | 'high';
    details: {
        sanctioned: boolean;
        flagged: boolean;
        lastUpdated: string;
    };
    mock?: boolean;
    fallback?: boolean;
    error?: boolean;
}

/**
 * Screen a wallet address for compliance using Range API
 * @param walletAddress - The Solana wallet address to screen
 * @returns Screening result with score and risk level
 */
export async function screenWallet(walletAddress: string): Promise<ScreeningResult> {
    try {
        const response = await fetch('/api/screen', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                walletAddress,
                blockchain: 'solana',
            }),
        });

        if (!response.ok) {
            throw new Error(`Screening failed: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Screening failed');
        }

        return result.data;
    } catch (error) {
        console.error('Wallet screening error:', error);

        // Return a safe default on error
        return {
            address: walletAddress,
            score: 50,
            riskScore: 5, // Medium risk default
            riskLevel: 'medium',
            details: {
                sanctioned: false,
                flagged: false,
                lastUpdated: new Date().toISOString(),
            },
            error: true,
        };
    }
}

/**
 * Get risk level from riskScore (1-10 scale from Range API)
 * <=2 = low risk, >2 & <=6 = medium risk, >6 = high risk
 */
export function getRiskLevel(riskScore: number): 'low' | 'medium' | 'high' {
    if (riskScore <= 2) return 'low';
    if (riskScore <= 6) return 'medium';
    return 'high';
}

/**
 * Get risk color for UI based on riskScore (1-10 scale)
 */
export function getRiskColor(riskScore: number): string {
    if (riskScore <= 2) return 'green';
    if (riskScore <= 6) return 'yellow';
    return 'red';
}

/**
 * Check if screening has expired (24 hours)
 */
export function isScreeningExpired(lastScreenedTimestamp: number): boolean {
    const now = Math.floor(Date.now() / 1000);
    const expirationSeconds = 24 * 60 * 60; // 24 hours
    return now - lastScreenedTimestamp > expirationSeconds;
}

/**
 * Check if wallet passes minimum screening threshold
 * Uses riskScore (1-10) where lower is better
 * Default threshold is 6 (medium risk or lower)
 */
export function passesScreening(riskScore: number, threshold: number = 6): boolean {
    return riskScore <= threshold;
}
