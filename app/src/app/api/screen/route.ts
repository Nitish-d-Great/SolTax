import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const RANGE_API_URL = 'https://api.range.org/v1';

export async function POST(request: NextRequest) {
    try {
        const { walletAddress, blockchain = 'solana' } = await request.json();

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Wallet address is required' },
                { status: 400 }
            );
        }

        // Get API key from environment variables
        // On Netlify, this should be set in Site Settings > Environment Variables
        // Try multiple ways to access the variable (for different deployment platforms)
        const apiKey = process.env.RANGE_API_KEY 
            || process.env['RANGE_API_KEY']
            || (process.env as any).RANGE_API_KEY;

        if (!apiKey || apiKey.trim() === '') {
            console.error('❌ Range API key not configured!');
            console.error('Environment check - RANGE_API_KEY exists:', !!process.env.RANGE_API_KEY);
            console.error('Environment check - RANGE_API_KEY value length:', process.env.RANGE_API_KEY?.length || 0);
            console.error('Available env vars with RANGE/API:', Object.keys(process.env).filter(k => k.includes('RANGE') || k.includes('API')).join(', ') || 'none');
            console.error('To fix: Set RANGE_API_KEY in Netlify Dashboard > Site Settings > Environment Variables');
            console.error('Then redeploy the site for changes to take effect');
            return mockResponse(walletAddress);
        }

        console.log('✅ Range API key found, using real API');

        // Call real Range API
        const url = `${RANGE_API_URL}/risk/address?address=${encodeURIComponent(walletAddress)}&network=${blockchain}`;
        console.log('Calling Range API:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        console.log('Range API response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error('❌ Range API failed:', response.status, errorText);
            
            // Only use mock if it's a 401/403 (auth error) - otherwise it might be a real API issue
            if (response.status === 401 || response.status === 403) {
                console.error('Authentication failed - check RANGE_API_KEY is correct');
                return mockResponse(walletAddress, true, response.status);
            }
            
            // For other errors, return error response instead of mock
            return NextResponse.json(
                { 
                    success: false, 
                    error: `Range API error: ${response.status}`,
                    message: 'Failed to screen wallet address'
                },
                { status: response.status }
            );
        }

        const data = await response.json();

        // SAVE RAW RESPONSE TO FILE for inspection/debugging
        try {
            const dataDir = path.join(process.cwd(), 'src/data/range-responses');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            const filePath = path.join(dataDir, `${walletAddress}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`Saved raw Range API response to ${filePath}`);
        } catch (fileError) {
            console.error('Failed to save raw API response:', fileError);
        }

        console.log('Range API data:', JSON.stringify(data).slice(0, 200));

        return parseRangeResponse(walletAddress, data);

    } catch (error) {
        console.error('Screening error:', error);
        return mockResponse('unknown', true);
    }
}

function parseRangeResponse(walletAddress: string, data: Record<string, unknown>) {
    // Range API returns riskScore (1-10), riskLevel, numHops, maliciousAddressesFound, reasoning, attribution
    let score: number | null = null;
    let riskLevel: 'low' | 'medium' | 'high' | undefined = undefined;
    let sanctioned = false;
    let flagged = false;

    // Read riskScore from API response (1-10 scale, where 10 is highest risk)
    if (typeof data.riskScore === 'number') {
        score = data.riskScore;
    } else if (data.riskScore === null || data.riskScore === undefined) {
        console.warn('riskScore not found in Range API response');
        score = null;
    }

    // Read riskLevel from API response
    if (typeof data.riskLevel === 'string') {
        const apiRiskLevel = data.riskLevel as string;
        // Map API risk levels to our internal format
        if (apiRiskLevel.includes('CRITICAL') || apiRiskLevel.includes('Extremely high')) {
            riskLevel = 'high';
            flagged = true;
        } else if (apiRiskLevel.includes('High risk')) {
            riskLevel = 'high';
        } else if (apiRiskLevel.includes('Medium risk')) {
            riskLevel = 'medium';
        } else if (apiRiskLevel.includes('Low risk') || apiRiskLevel.includes('Very low risk')) {
            riskLevel = 'low';
        }
    }

    // If riskScore is available but riskLevel wasn't mapped, derive it from score
    if (score !== null && riskLevel === undefined) {
        // riskScore 1-10: 1-2 = low, 3-5 = medium, 6-10 = high
        if (score <= 2) {
            riskLevel = 'low';
        } else if (score <= 5) {
            riskLevel = 'medium';
        } else {
            riskLevel = 'high';
            flagged = true; // High risk scores indicate flagged addresses
        }
    }

    // Check if address is directly malicious (numHops === 0 or riskScore === 10)
    if (data.numHops === 0 || score === 10) {
        flagged = true;
        sanctioned = true; // Directly malicious addresses are considered sanctioned
    }

    // Check for malicious addresses found
    if (Array.isArray(data.maliciousAddressesFound) && data.maliciousAddressesFound.length > 0) {
        flagged = true;
    }

    // Convert riskScore (1-10) to a 0-100 scale for backward compatibility if needed
    // Higher riskScore (10) = lower trust score (0), Lower riskScore (1) = higher trust score (100)
    let trustScore: number | null = null;
    if (score !== null) {
        // Invert: riskScore 10 -> trustScore 0, riskScore 1 -> trustScore 100
        trustScore = Math.round(((10 - score) / 9) * 100);
    }

    return NextResponse.json({
        success: true,
        data: {
            address: walletAddress,
            score: trustScore ?? (score !== null ? score * 10 : null), // Convert to 0-100 scale or use score*10
            riskScore: score, // Include original riskScore (1-10)
            riskLevel,
            details: {
                sanctioned,
                flagged,
                numHops: typeof data.numHops === 'number' ? data.numHops : undefined,
                reasoning: typeof data.reasoning === 'string' ? data.reasoning : undefined,
                maliciousAddressesFound: Array.isArray(data.maliciousAddressesFound) 
                    ? data.maliciousAddressesFound 
                    : [],
                attribution: data.attribution || null,
                lastUpdated: new Date().toISOString(),
                rawResponse: data,
            },
            mock: false,
        }
    });
}

function mockResponse(walletAddress: string, fallback = false, apiError?: number) {
    // Generate mock riskScore (1-10 scale) - random between 1-8 for demo
    const mockRiskScore = Math.floor(Math.random() * 8) + 1; // 1-8
    const riskLevel = mockRiskScore <= 2 ? 'low' : mockRiskScore <= 6 ? 'medium' : 'high';
    
    return NextResponse.json({
        success: true,
        data: {
            address: walletAddress,
            score: Math.round(((10 - mockRiskScore) / 9) * 100), // Convert to 0-100 for backward compatibility
            riskScore: mockRiskScore, // Use riskScore (1-10) scale
            riskLevel,
            details: {
                sanctioned: false,
                flagged: mockRiskScore > 6,
                lastUpdated: new Date().toISOString(),
            },
            mock: !fallback,
            fallback: fallback,
            apiError: apiError,
        }
    });
}
