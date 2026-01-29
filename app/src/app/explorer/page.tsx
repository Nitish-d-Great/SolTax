'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from '@/components/WalletButton';
import {
    Lock,
    Search,
    CheckCircle,
    Clock,
    ExternalLink,
    Shield,
    Eye
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { format } from 'date-fns';

// Demo payment records
const DEMO_PAYMENTS = [
    {
        id: 'pay_001',
        employeeId: 'EMP001',
        employeeName: 'Alice Johnson',
        timestamp: Date.now() - 3600000, // 1 hour ago
        verified: true,
        verifiedAt: Date.now() - 1800000,
        verifier: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        txHash: '5UfNmNZeCQRQPKYm2bG7B8FqvZQ9Q4kQYgBp2fxqUdJS',
    },
    {
        id: 'pay_002',
        employeeId: 'EMP002',
        employeeName: 'Bob Smith',
        timestamp: Date.now() - 86400000, // 1 day ago
        verified: true,
        verifiedAt: Date.now() - 82800000,
        verifier: '9aE476sH92Vb7W3RFf2JG1b5XHGVAMVVr5cGtcXqZnJd',
        txHash: '3xKmNZeCQRQPKYm2bG7B8FqvZQ9Q4kQYgBp2fxqUdJT',
    },
    {
        id: 'pay_003',
        employeeId: 'EMP001',
        employeeName: 'Alice Johnson',
        timestamp: Date.now() - 172800000, // 2 days ago
        verified: false,
        verifiedAt: null,
        verifier: null,
        txHash: '7yLmNZeCQRQPKYm2bG7B8FqvZQ9Q4kQYgBp2fxqUdJU',
    },
    {
        id: 'pay_004',
        employeeId: 'EMP003',
        employeeName: 'Carol Williams',
        timestamp: Date.now() - 259200000, // 3 days ago
        verified: false,
        verifiedAt: null,
        verifier: null,
        txHash: '2zMmNZeCQRQPKYm2bG7B8FqvZQ9Q4kQYgBp2fxqUdJV',
    },
];

export default function ExplorerPage() {
    const { publicKey, connected } = useWallet();
    const [payments, setPayments] = useState(DEMO_PAYMENTS);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'verified' | 'pending'>('all');
    const [verifying, setVerifying] = useState<string | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<typeof DEMO_PAYMENTS[0] | null>(null);

    const filteredPayments = payments
        .filter(p => {
            if (filter === 'verified') return p.verified;
            if (filter === 'pending') return !p.verified;
            return true;
        })
        .filter(p =>
            p.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.txHash.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const handleVerifyProof = async (paymentId: string) => {
        setVerifying(paymentId);

        try {
            // Simulate proof verification
            await new Promise(resolve => setTimeout(resolve, 2000));

            setPayments(prev => prev.map(p =>
                p.id === paymentId
                    ? {
                        ...p,
                        verified: true,
                        verifiedAt: Date.now(),
                        verifier: publicKey?.toBase58() || 'Unknown'
                    }
                    : p
            ));
        } catch (error) {
            console.error('Verification failed:', error);
        } finally {
            setVerifying(null);
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
                            <Link href="/explorer" className="text-white font-medium">Explorer</Link>
                        </div>

                        <WalletButton />
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Payment Explorer</h1>
                    <p className="text-gray-400 mt-1">Browse and verify payment proofs</p>
                </div>

                {/* Filters */}
                <div className="glass-card p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by employee, ID, or transaction..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <div className="flex gap-2">
                            {(['all', 'verified', 'pending'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-lg font-medium capitalize transition ${filter === f
                                        ? 'bg-indigo-500 text-white'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Payment Cards */}
                <div className="grid md:grid-cols-2 gap-4">
                    {filteredPayments.map(payment => (
                        <div key={payment.id} className="glass-card p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="font-semibold text-lg">{payment.employeeName}</p>
                                    <p className="text-sm text-gray-400">{payment.employeeId}</p>
                                </div>
                                {payment.verified ? (
                                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                                        <CheckCircle className="h-4 w-4" />
                                        Verified
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm">
                                        <Clock className="h-4 w-4" />
                                        Pending
                                    </span>
                                )}
                            </div>

                            {/* Confidential Amounts */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="p-3 bg-gray-800/50 rounded-lg">
                                    <p className="text-xs text-gray-400 mb-1">Tax Amount</p>
                                    <p className="font-mono amount-blur text-yellow-400">$XXX.XX</p>
                                </div>
                                <div className="p-3 bg-gray-800/50 rounded-lg">
                                    <p className="text-xs text-gray-400 mb-1">Net Salary</p>
                                    <p className="font-mono amount-blur text-green-400">$X,XXX.XX</p>
                                </div>
                            </div>

                            {/* Payment Details */}
                            <div className="space-y-2 text-sm mb-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Date</span>
                                    <span>{format(payment.timestamp, 'MMM d, yyyy h:mm a')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Transaction</span>
                                    <a
                                        href={`https://explorer.solana.com/tx/${payment.txHash}?cluster=devnet`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                                    >
                                        {payment.txHash.slice(0, 8)}...
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>
                                {payment.verified && payment.verifiedAt && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Verified At</span>
                                        <span>{format(payment.verifiedAt, 'MMM d, yyyy h:mm a')}</span>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                {!payment.verified && (
                                    <button
                                        onClick={() => handleVerifyProof(payment.id)}
                                        disabled={verifying === payment.id || !connected}
                                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                                    >
                                        {verifying === payment.id ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Verifying...
                                            </>
                                        ) : (
                                            <>
                                                <Shield className="h-4 w-4" />
                                                Verify Proof
                                            </>
                                        )}
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedPayment(payment)}
                                    className="btn-secondary flex items-center justify-center gap-2"
                                >
                                    <Eye className="h-4 w-4" />
                                    Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredPayments.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <p>No payments found matching your criteria</p>
                    </div>
                )}

                {/* Privacy Notice */}
                <div className="glass-card p-6 mt-8">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <Lock className="h-6 w-6 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Privacy Notice</h3>
                            <p className="text-gray-400 text-sm">
                                All payment amounts displayed as "CONFIDENTIAL" are encrypted using Bulletproof
                                zero-knowledge proofs. The blurred amounts shown are placeholders - actual values
                                can only be decrypted by the sender (employer) or recipient (employee/tax authority).
                                Anyone can verify that proofs are valid without learning the amounts.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Payment Details Modal */}
            {selectedPayment && (
                <div className="modal-overlay" onClick={() => setSelectedPayment(null)}>
                    <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold mb-6">Payment Details</h2>

                        <div className="space-y-4">
                            <div className="p-4 bg-gray-800/50 rounded-lg">
                                <p className="text-sm text-gray-400 mb-1">Employee</p>
                                <p className="font-semibold">{selectedPayment.employeeName}</p>
                                <p className="text-sm text-gray-400">{selectedPayment.employeeId}</p>
                            </div>

                            <div className="p-4 bg-gray-800/50 rounded-lg">
                                <p className="text-sm text-gray-400 mb-1">Transaction Hash</p>
                                <code className="text-sm break-all">{selectedPayment.txHash}</code>
                            </div>

                            <div className="p-4 bg-gray-800/50 rounded-lg">
                                <p className="text-sm text-gray-400 mb-1">Timestamp</p>
                                <p>{format(selectedPayment.timestamp, 'MMMM d, yyyy h:mm:ss a')}</p>
                            </div>

                            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield className="h-5 w-5 text-purple-400" />
                                    <p className="font-semibold">Bulletproof ZK Proof</p>
                                </div>
                                <p className="text-sm text-gray-400">
                                    This payment uses ShadowWire's Bulletproof range proofs to hide the
                                    exact tax and salary amounts while proving they are valid positive numbers.
                                </p>
                            </div>

                            <div className={`p-4 rounded-lg ${selectedPayment.verified ? 'bg-green-500/10 border border-green-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {selectedPayment.verified ? (
                                        <CheckCircle className="h-5 w-5 text-green-400" />
                                    ) : (
                                        <Clock className="h-5 w-5 text-yellow-400" />
                                    )}
                                    <p className="font-semibold">
                                        {selectedPayment.verified ? 'Proof Verified' : 'Awaiting Verification'}
                                    </p>
                                </div>
                                {selectedPayment.verified && selectedPayment.verifier && (
                                    <p className="text-sm text-gray-400">
                                        Verified by: {selectedPayment.verifier.slice(0, 8)}...{selectedPayment.verifier.slice(-8)}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-4 mt-6">
                            <button onClick={() => setSelectedPayment(null)} className="btn-secondary flex-1">
                                Close
                            </button>
                            <a
                                href={`https://explorer.solana.com/tx/${selectedPayment.txHash}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary flex-1 flex items-center justify-center gap-2"
                            >
                                View on Explorer
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
