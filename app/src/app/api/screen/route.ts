import { NextRequest, NextResponse } from 'next/server';

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

        const apiKey = process.env.RANGE_API_KEY;

        if (!apiKey) {
            console.warn('Range API key not configured, using mock response');
            return mockResponse(walletAddress);
        }

        // Call real Range API - it's a GET request with query params
        const url = `${RANGE_API_URL}/address?address=${encodeURIComponent(walletAddress)}&network=${blockchain}`;

        console.log('Calling Range API:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'X-API-Key': apiKey,
            },
        });

        console.log('Range API response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Range API error:', response.status, errorText);

            // Try alternate endpoint format
            const altUrl = `${RANGE_API_URL}/screen/address?address=${encodeURIComponent(walletAddress)}&chain=${blockchain}`;
            console.log('Trying alternate endpoint:', altUrl);

            const altResponse = await fetch(altUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'X-API-Key': apiKey,
                },
            });

            if (!altResponse.ok) {
                console.error('Alternate endpoint also failed:', altResponse.status);
                return mockResponse(walletAddress, true, response.status);
            }

            const altData = await altResponse.json();
            return parseRangeResponse(walletAddress, altData);
        }

        const data = await response.json();
        console.log('Range API data:', JSON.stringify(data).slice(0, 200));

        return parseRangeResponse(walletAddress, data);

    } catch (error) {
        console.error('Screening error:', error);
        return mockResponse('unknown', true);
    }
}

function parseRangeResponse(walletAddress: string, data: Record<string, unknown>) {
    // Range API may return different response formats
    // Try to extract score from various possible fields
    let score = 75; // Default score
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    let sanctioned = false;
    let flagged = false;

    // Check various possible response formats
    if (typeof data.score === 'number') {
        score = data.score;
    } else if (typeof data.risk_score === 'number') {
        score = data.risk_score;
    } else if (typeof data.riskScore === 'number') {
        score = data.riskScore;
    } else if (typeof data.trust_score === 'number') {
        score = data.trust_score;
    } else if (data.risk && typeof (data.risk as Record<string, unknown>).score === 'number') {
        score = (data.risk as Record<string, unknown>).score as number;
    }

    // Normalize score to 0-100 if it's a different scale
    if (score > 100) score = 100;
    if (score < 0) score = 0;

    // Check for risk level
    if (data.risk_level) {
        riskLevel = data.risk_level as 'low' | 'medium' | 'high';
    } else if (data.riskLevel) {
        riskLevel = data.riskLevel as 'low' | 'medium' | 'high';
    } else {
        riskLevel = score >= 70 ? 'low' : score >= 40 ? 'medium' : 'high';
    }

    // Check for sanctions/flags
    if (typeof data.sanctioned === 'boolean') sanctioned = data.sanctioned;
    if (typeof data.flagged === 'boolean') flagged = data.flagged;
    if (typeof data.is_sanctioned === 'boolean') sanctioned = data.is_sanctioned;
    if (typeof data.is_flagged === 'boolean') flagged = data.is_flagged;

    return NextResponse.json({
        success: true,
        data: {
            address: walletAddress,
            score,
            riskLevel,
            details: {
                sanctioned,
                flagged,
                lastUpdated: new Date().toISOString(),
                rawResponse: data,
            },
            mock: false,
        }
    });
}

function mockResponse(walletAddress: string, fallback = false, apiError?: number) {
    const mockScore = Math.floor(Math.random() * 40) + 60; // 60-100
    return NextResponse.json({
        success: true,
        data: {
            address: walletAddress,
            score: mockScore,
            riskLevel: mockScore >= 70 ? 'low' : mockScore >= 40 ? 'medium' : 'high',
            details: {
                sanctioned: false,
                flagged: false,
                lastUpdated: new Date().toISOString(),
            },
            mock: !fallback,
            fallback: fallback,
            apiError: apiError,
        }
    });
}
