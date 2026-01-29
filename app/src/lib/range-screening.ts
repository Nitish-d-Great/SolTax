// Range API client for wallet screening
// This client calls the server-side API route which has access to the API key

export interface ScreeningResult {
    address: string;
    score: number;
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
 * Get risk level from score
 */
export function getRiskLevel(score: number): 'low' | 'medium' | 'high' {
    if (score >= 70) return 'low';
    if (score >= 40) return 'medium';
    return 'high';
}

/**
 * Get risk color for UI
 */
export function getRiskColor(score: number): string {
    if (score >= 70) return 'green';
    if (score >= 40) return 'yellow';
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
 */
export function passesScreening(score: number, threshold: number = 50): boolean {
    return score >= threshold;
}
