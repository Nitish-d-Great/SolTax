import { NextResponse } from 'next/server';

// Debug endpoint to check if environment variables are accessible
export async function GET() {
    const hasApiKey = !!process.env.RANGE_API_KEY;
    const apiKeyLength = process.env.RANGE_API_KEY?.length || 0;
    const apiKeyPrefix = process.env.RANGE_API_KEY?.substring(0, 10) || 'not set';
    
    // Get all environment variables that contain RANGE or API
    const relevantEnvVars = Object.keys(process.env)
        .filter(k => k.includes('RANGE') || k.includes('API'))
        .reduce((acc, key) => {
            acc[key] = {
                exists: !!process.env[key],
                length: process.env[key]?.length || 0,
                prefix: process.env[key]?.substring(0, 10) || 'not set'
            };
            return acc;
        }, {} as Record<string, { exists: boolean; length: number; prefix: string }>);

    return NextResponse.json({
        timestamp: new Date().toISOString(),
        environment: {
            nodeEnv: process.env.NODE_ENV,
            vercelEnv: process.env.VERCEL_ENV,
            netlify: process.env.NETLIFY ? 'true' : 'false',
        },
        rangeApiKey: {
            exists: hasApiKey,
            length: apiKeyLength,
            prefix: hasApiKey ? `${apiKeyPrefix}...` : 'not set',
        },
        allRelevantEnvVars: relevantEnvVars,
        allEnvVarKeys: Object.keys(process.env).filter(k => k.includes('RANGE') || k.includes('API')),
    }, {
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
    });
}
