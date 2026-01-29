'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from '@/components/WalletButton';
import {
    Lock,
    Settings,
    Save,
    AlertCircle,
    CheckCircle,
    Wallet,
    Percent,
    Building
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function SettingsPage() {
    const { publicKey, connected } = useWallet();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [settings, setSettings] = useState({
        taxRate: '5',
        taxAuthority: '',
        screeningThreshold: '50',
        rescreenInterval: '24',
    });

    const handleSave = async () => {
        setSaving(true);

        try {
            // Simulate saving to blockchain
            await new Promise(resolve => setTimeout(resolve, 2000));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen">
            {/* Navigation */}
            <nav className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-lg sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <Link href="/" className="flex items-center gap-2">
                                <Lock className="h-8 w-8 text-indigo-500" />
                                <span className="text-xl font-bold gradient-text">ZK Payroll</span>
                            </Link>
                        </div>

                        <div className="hidden md:flex items-center gap-8">
                            <Link href="/" className="text-gray-400 hover:text-white transition">Dashboard</Link>
                            <Link href="/employees" className="text-gray-400 hover:text-white transition">Employees</Link>
                            <Link href="/payments" className="text-gray-400 hover:text-white transition">Payments</Link>
                            <Link href="/explorer" className="text-gray-400 hover:text-white transition">Explorer</Link>
                        </div>

                        <WalletButton />
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                        <Settings className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Settings</h1>
                        <p className="text-gray-400">Configure your payroll system</p>
                    </div>
                </div>

                {!connected ? (
                    <div className="glass-card p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Wallet Not Connected</h2>
                        <p className="text-gray-400 mb-4">Connect your wallet to access settings</p>
                        <WalletButton />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Tax Configuration */}
                        <div className="glass-card p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                    <Percent className="h-5 w-5 text-yellow-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold">Tax Configuration</h2>
                                    <p className="text-sm text-gray-400">Configure tax rate and authority</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label>Tax Rate (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={settings.taxRate}
                                        onChange={e => setSettings(prev => ({ ...prev, taxRate: e.target.value }))}
                                        placeholder="5"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        Percentage of salary withheld as tax (0-100)
                                    </p>
                                </div>

                                <div>
                                    <label>Tax Authority Wallet</label>
                                    <input
                                        type="text"
                                        value={settings.taxAuthority}
                                        onChange={e => setSettings(prev => ({ ...prev, taxAuthority: e.target.value }))}
                                        placeholder="Enter government/tax authority wallet address"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        Confidential tax payments will be sent to this wallet
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Compliance Configuration */}
                        <div className="glass-card p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                    <Building className="h-5 w-5 text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold">Compliance Settings</h2>
                                    <p className="text-sm text-gray-400">Range API screening configuration</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label>Minimum Screening Score</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={settings.screeningThreshold}
                                        onChange={e => setSettings(prev => ({ ...prev, screeningThreshold: e.target.value }))}
                                        placeholder="50"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        Wallets with scores below this threshold will be rejected
                                    </p>
                                </div>

                                <div>
                                    <label>Re-screening Interval (hours)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="168"
                                        value={settings.rescreenInterval}
                                        onChange={e => setSettings(prev => ({ ...prev, rescreenInterval: e.target.value }))}
                                        placeholder="24"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        How often employees must be re-screened before payments
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Wallet Info */}
                        <div className="glass-card p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                    <Wallet className="h-5 w-5 text-green-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold">Connected Wallet</h2>
                                    <p className="text-sm text-gray-400">Your employer wallet</p>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-800/50 rounded-lg">
                                <code className="text-sm break-all">{publicKey?.toBase58()}</code>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end gap-4">
                            {saved && (
                                <span className="flex items-center gap-2 text-green-400">
                                    <CheckCircle className="h-5 w-5" />
                                    Settings saved!
                                </span>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="btn-primary flex items-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Save Settings
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
