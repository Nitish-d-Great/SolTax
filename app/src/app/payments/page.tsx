'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from '@/components/WalletButton';
import {
    Lock,
    CreditCard,
    AlertCircle,
    CheckCircle,
    ArrowRight,
    Shield,
    Eye,
    EyeOff
} from 'lucide-react';
import Link from 'next/link';
import { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { screenWallet, passesScreening } from '@/lib/range-screening';
import { useEmployees, Employee } from '@/providers/EmployeeProvider';
import { processSalaryPayment } from '@/lib/shadowwire-client';
import { TAX_AUTHORITY } from '@/lib/anchor-client';

type PaymentStep = 'select' | 'confirm' | 'processing' | 'success' | 'error';

// Inner component that uses useSearchParams
function PaymentsContent() {
    const { publicKey, connected, signMessage } = useWallet();
    const searchParams = useSearchParams();
    const preselectedEmployee = searchParams.get('employee');
    const { employees, getEmployee } = useEmployees();

    const [step, setStep] = useState<PaymentStep>('select');
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [showAmounts, setShowAmounts] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [txHash, setTxHash] = useState('');
    const [taxTxHash, setTaxTxHash] = useState('');
    const [isSimulated, setIsSimulated] = useState(false);
    const [error, setError] = useState('');

    // Set preselected employee when component mounts or employees change
    useEffect(() => {
        if (preselectedEmployee && !selectedEmployee) {
            const employee = getEmployee(preselectedEmployee);
            if (employee) {
                setSelectedEmployee(employee);
            }
        }
    }, [preselectedEmployee, employees, getEmployee, selectedEmployee]);

    const taxRate = 0.05; // 5%
    const taxAmount = selectedEmployee ? selectedEmployee.salary * taxRate : 0;
    const netSalary = selectedEmployee ? selectedEmployee.salary - taxAmount : 0;

    const handleConfirmPayment = async () => {
        if (!selectedEmployee || !connected || !publicKey || !signMessage) return;

        setStep('processing');
        setProcessing(true);
        setError('');

        try {
            // Step 1: Re-screen wallet before payment
            console.log('Step 1: Screening employee wallet...');
            const screeningResult = await screenWallet(selectedEmployee.wallet);

            // Use riskScore (1-10) if available, otherwise convert from legacy score
            const riskScore = screeningResult.riskScore ?? (screeningResult.score / 10);
            
            if (!passesScreening(riskScore)) {
                throw new Error(`Wallet screening failed with risk score ${riskScore}/10`);
            }
            console.log('Screening passed with risk score:', riskScore, '/10');

            // Step 2: Execute confidential payment via ShadowWire
            console.log('Step 2: Processing confidential payment via ShadowWire...');
            const paymentResult = await processSalaryPayment(
                publicKey.toBase58(),
                selectedEmployee.wallet,
                TAX_AUTHORITY.toBase58(),
                selectedEmployee.salary,
                taxRate,
                'SOL',
                signMessage
            );

            if (!paymentResult.success) {
                throw new Error(paymentResult.error || 'Payment failed');
            }

            console.log('Payment successful!');
            console.log('Net salary TX:', paymentResult.netSalaryTx);
            console.log('Tax TX:', paymentResult.taxTx);

            setTxHash(paymentResult.netSalaryTx || 'tx_success');
            setTaxTxHash(paymentResult.taxTx || '');
            setStep('success');
        } catch (err) {
            console.error('Payment error:', err);
            setError(err instanceof Error ? err.message : 'Payment failed');
            setStep('error');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <main className="max-w-3xl mx-auto px-4 py-12">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold">Process Payment</h1>
                <p className="text-gray-400 mt-2">Execute confidential salary payments with ZK proofs</p>
            </div>

            {/* Progress Steps */}
            <div className="flex justify-center mb-12">
                <div className="flex items-center gap-4">
                    <StepIndicator
                        step={1}
                        label="Select"
                        active={step === 'select'}
                        complete={step !== 'select'}
                    />
                    <div className="w-12 h-0.5 bg-gray-700"></div>
                    <StepIndicator
                        step={2}
                        label="Confirm"
                        active={step === 'confirm'}
                        complete={['processing', 'success'].includes(step)}
                    />
                    <div className="w-12 h-0.5 bg-gray-700"></div>
                    <StepIndicator
                        step={3}
                        label="Complete"
                        active={step === 'success'}
                        complete={false}
                    />
                </div>
            </div>

            {/* Step Content */}
            <div className="glass-card p-8">
                {step === 'select' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold">Select Employee</h2>

                        <div className="space-y-3">
                            {employees.map(employee => (
                                <button
                                    key={employee.id}
                                    onClick={() => setSelectedEmployee(employee)}
                                    className={`w-full p-4 rounded-lg border transition text-left flex items-center justify-between ${selectedEmployee?.id === employee.id
                                        ? 'border-indigo-500 bg-indigo-500/10'
                                        : 'border-gray-700 hover:border-gray-600'
                                        }`}
                                >
                                    <div>
                                        <p className="font-medium">{employee.name}</p>
                                        <p className="text-sm text-gray-400">{employee.id}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono amount-blur">${employee.salary.toLocaleString()}</p>
                                        <p className="text-xs text-gray-400">Monthly</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => selectedEmployee && setStep('confirm')}
                            disabled={!selectedEmployee}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            Continue <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {step === 'confirm' && selectedEmployee && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Confirm Payment</h2>
                            <button
                                onClick={() => setShowAmounts(!showAmounts)}
                                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
                                title={showAmounts ? 'Hide amounts' : 'Show amounts'}
                            >
                                {showAmounts ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>

                        {/* Employee Info */}
                        <div className="p-4 bg-gray-800/50 rounded-lg">
                            <p className="text-sm text-gray-400">Paying to</p>
                            <p className="font-semibold text-lg">{selectedEmployee.name}</p>
                            <code className="text-sm text-gray-400">
                                {selectedEmployee.wallet.slice(0, 8)}...{selectedEmployee.wallet.slice(-8)}
                            </code>
                        </div>

                        {/* Payment Breakdown */}
                        <div className="space-y-3">
                            <div className="flex justify-between p-3 bg-gray-800/30 rounded-lg">
                                <span className="text-gray-400">Total Salary</span>
                                <span className={`font-mono ${!showAmounts ? 'amount-blur' : ''}`}>
                                    ${selectedEmployee.salary.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between p-3 bg-gray-800/30 rounded-lg">
                                <span className="text-gray-400">Tax (5%)</span>
                                <span className={`font-mono text-yellow-400 ${!showAmounts ? 'amount-blur' : ''}`}>
                                    -${taxAmount.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                                <span className="font-semibold">Net to Employee</span>
                                <span className={`font-mono font-semibold text-green-400 ${!showAmounts ? 'amount-blur' : ''}`}>
                                    ${netSalary.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Privacy Notice */}
                        <div className="flex items-start gap-3 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                            <Shield className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-medium text-purple-300">Privacy Protected</p>
                                <p className="text-sm text-gray-400">
                                    Both tax and salary amounts will be hidden using Bulletproof ZK proofs.
                                    Only the sender and recipient can see the actual amounts.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep('select')}
                                className="btn-secondary flex-1"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleConfirmPayment}
                                className="btn-primary flex-1 flex items-center justify-center gap-2"
                            >
                                <Lock className="h-4 w-4" />
                                Confirm & Pay
                            </button>
                        </div>
                    </div>
                )}

                {step === 'processing' && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                        <h2 className="text-xl font-semibold mb-2">Processing Payment</h2>
                        <p className="text-gray-400">Generating Bulletproof ZK proofs...</p>
                        <div className="mt-8 space-y-2 text-sm text-gray-500">
                            <p>✓ Wallet screening verified</p>
                            <p>✓ Tax payment (confidential)</p>
                            <p className="animate-pulse">⟳ Net salary transfer...</p>
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Payment Complete!</h2>
                        <p className="text-gray-400 mb-6">
                            Salary has been sent via confidential transfer
                        </p>

                        <div className="p-4 bg-gray-800/50 rounded-lg text-left mb-6">
                            <p className="text-sm text-gray-400 mb-1">Transaction</p>
                            <code className="text-sm break-all">{txHash}</code>
                        </div>

                        <div className="flex gap-4">
                            <Link href="/explorer" className="btn-secondary flex-1 text-center">
                                View in Explorer
                            </Link>
                            <button
                                onClick={() => {
                                    setStep('select');
                                    setSelectedEmployee(null);
                                }}
                                className="btn-primary flex-1"
                            >
                                New Payment
                            </button>
                        </div>
                    </div>
                )}

                {step === 'error' && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Payment Failed</h2>
                        <p className="text-gray-400 mb-6">{error}</p>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep('confirm')}
                                className="btn-secondary flex-1"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => {
                                    setStep('select');
                                    setSelectedEmployee(null);
                                    setError('');
                                }}
                                className="btn-primary flex-1"
                            >
                                Start Over
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

// Loading fallback
function PaymentsLoading() {
    return (
        <main className="max-w-3xl mx-auto px-4 py-12">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold">Process Payment</h1>
                <p className="text-gray-400 mt-2">Loading...</p>
            </div>
            <div className="glass-card p-8 flex justify-center">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        </main>
    );
}

// Main page component with Suspense boundary
export default function PaymentsPage() {
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
                            <Link href="/payments" className="text-white font-medium">Payments</Link>
                            <Link href="/explorer" className="text-gray-400 hover:text-white transition">Explorer</Link>
                        </div>

                        <WalletButton />
                    </div>
                </div>
            </nav>

            <Suspense fallback={<PaymentsLoading />}>
                <PaymentsContent />
            </Suspense>
        </div>
    );
}

function StepIndicator({
    step,
    label,
    active,
    complete
}: {
    step: number;
    label: string;
    active: boolean;
    complete: boolean;
}) {
    return (
        <div className="flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${complete
                ? 'bg-green-500 text-white'
                : active
                    ? 'bg-indigo-500 text-white animate-pulse-glow'
                    : 'bg-gray-800 text-gray-400'
                }`}>
                {complete ? <CheckCircle className="h-5 w-5" /> : step}
            </div>
            <span className={`text-xs ${active ? 'text-white' : 'text-gray-400'}`}>{label}</span>
        </div>
    );
}
