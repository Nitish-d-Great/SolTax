'use client';

import dynamic from 'next/dynamic';

// Dynamically import WalletMultiButton with SSR disabled to prevent hydration errors
export const WalletButton = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    {
        ssr: false,
        loading: () => (
            <button className="wallet-adapter-button wallet-adapter-button-trigger" disabled>
                Loading...
            </button>
        )
    }
);
