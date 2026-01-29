'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from '@/components/WalletButton';
import {
    Users,
    Plus,
    Search,
    Lock,
    AlertCircle,
    CheckCircle,
    CreditCard,
    RefreshCw,
    Eye
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { getRiskColor, getRiskLevel, screenWallet, isScreeningExpired } from '@/lib/range-screening';

// Demo employee data
const DEMO_EMPLOYEES = [
    {
        id: 'EMP001',
        name: 'Alice Johnson',
        wallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        salary: 5000,
        screeningScore: 85,
        lastScreened: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        isActive: true,
    },
    {
        id: 'EMP002',
        name: 'Bob Smith',
        wallet: '9aE476sH92Vb7W3RFf2JG1b5XHGVAMVVr5cGtcXqZnJd',
        salary: 6500,
        screeningScore: 72,
        lastScreened: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
        isActive: true,
    },
    {
        id: 'EMP003',
        name: 'Carol Williams',
        wallet: '5vPwBHMLxc3hYTJDaD5VNJwNvDGKJpvADMmQNHR8Lq1C',
        salary: 4800,
        screeningScore: 45,
        lastScreened: Math.floor(Date.now() / 1000) - 90000, // 25 hours ago (expired)
        isActive: true,
    },
];

export default function EmployeesPage() {
    const { publicKey, connected } = useWallet();
    const [employees, setEmployees] = useState(DEMO_EMPLOYEES);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [rescreening, setRescreening] = useState<string | null>(null);

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.wallet.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRescreen = async (employeeId: string, wallet: string) => {
        setRescreening(employeeId);
        try {
            const result = await screenWallet(wallet);
            setEmployees(prev => prev.map(emp =>
                emp.id === employeeId
                    ? { ...emp, screeningScore: result.score, lastScreened: Math.floor(Date.now() / 1000) }
                    : emp
            ));
        } catch (error) {
            console.error('Rescreening failed:', error);
        } finally {
            setRescreening(null);
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
                            <Link href="/employees" className="text-white font-medium">Employees</Link>
                            <Link href="/payments" className="text-gray-400 hover:text-white transition">Payments</Link>
                            <Link href="/explorer" className="text-gray-400 hover:text-white transition">Explorer</Link>
                        </div>

                        <WalletButton />
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Employees</h1>
                        <p className="text-gray-400 mt-1">Manage employees and wallet screening</p>
                    </div>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add Employee
                    </button>
                </div>

                {/* Search */}
                <div className="glass-card p-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, ID, or wallet address..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Employees Table */}
                <div className="glass-card table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Wallet</th>
                                <th>Salary</th>
                                <th>Screening</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.map((employee) => {
                                const riskLevel = getRiskLevel(employee.screeningScore);
                                const expired = isScreeningExpired(employee.lastScreened);

                                return (
                                    <tr key={employee.id}>
                                        <td>
                                            <div>
                                                <p className="font-medium">{employee.name}</p>
                                                <p className="text-sm text-gray-400">{employee.id}</p>
                                            </div>
                                        </td>
                                        <td>
                                            <code className="text-sm bg-gray-800 px-2 py-1 rounded">
                                                {employee.wallet.slice(0, 4)}...{employee.wallet.slice(-4)}
                                            </code>
                                        </td>
                                        <td>
                                            <span className="amount-blur cursor-help" title="Hidden for privacy">
                                                ${employee.salary.toLocaleString()}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium risk-${riskLevel}`}>
                                                    {employee.screeningScore}/100
                                                </span>
                                                {expired && (
                                                    <span className="text-xs text-yellow-500 flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" />
                                                        Expired
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            {employee.isActive ? (
                                                <span className="flex items-center gap-1 text-green-500">
                                                    <CheckCircle className="h-4 w-4" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-gray-500">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleRescreen(employee.id, employee.wallet)}
                                                    disabled={rescreening === employee.id}
                                                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition disabled:opacity-50"
                                                    title="Re-screen wallet"
                                                >
                                                    <RefreshCw className={`h-4 w-4 ${rescreening === employee.id ? 'animate-spin' : ''}`} />
                                                </button>
                                                <Link
                                                    href={`/payments?employee=${employee.id}`}
                                                    className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition"
                                                    title="Pay salary"
                                                >
                                                    <CreditCard className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
                                                    title="View details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-6 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        Low Risk (70-100)
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                        Medium Risk (40-69)
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        High Risk (0-39)
                    </div>
                </div>
            </main>

            {/* Add Employee Modal */}
            {showAddModal && (
                <AddEmployeeModal
                    onClose={() => setShowAddModal(false)}
                    onAdd={(employee) => {
                        setEmployees(prev => [...prev, employee]);
                        setShowAddModal(false);
                    }}
                />
            )}
        </div>
    );
}

// Add Employee Modal
function AddEmployeeModal({
    onClose,
    onAdd
}: {
    onClose: () => void;
    onAdd: (employee: typeof DEMO_EMPLOYEES[0]) => void;
}) {
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        wallet: '',
        salary: '',
    });
    const [screening, setScreening] = useState<{
        score: number;
        status: 'idle' | 'loading' | 'done' | 'error';
        isMock?: boolean;
        isError?: boolean;
    }>({
        score: 0,
        status: 'idle'
    });
    const [error, setError] = useState('');

    const handleScreenWallet = async () => {
        if (!formData.wallet) {
            setError('Please enter a wallet address');
            return;
        }

        setScreening({ score: 0, status: 'loading' });
        try {
            const result = await screenWallet(formData.wallet);
            setScreening({
                score: result.score,
                status: 'done',
                isMock: result.mock || result.fallback,
                isError: result.error
            });

            if (result.score < 50) {
                setError('Wallet screening failed: score below threshold of 50');
            } else {
                setError('');
            }
        } catch (err) {
            setScreening({ score: 0, status: 'error' });
            setError('Screening failed. Please try again.');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (screening.status !== 'done' || screening.score < 50) {
            setError('Please complete wallet screening first');
            return;
        }

        onAdd({
            id: formData.id,
            name: formData.name,
            wallet: formData.wallet,
            salary: parseFloat(formData.salary),
            screeningScore: screening.score,
            lastScreened: Math.floor(Date.now() / 1000),
            isActive: true,
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6">Add Employee</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label>Employee ID</label>
                        <input
                            type="text"
                            placeholder="EMP004"
                            value={formData.id}
                            onChange={e => setFormData(prev => ({ ...prev, id: e.target.value }))}
                            required
                        />
                    </div>

                    <div>
                        <label>Name</label>
                        <input
                            type="text"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            required
                        />
                    </div>

                    <div>
                        <label>Wallet Address</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Solana wallet address"
                                value={formData.wallet}
                                onChange={e => setFormData(prev => ({ ...prev, wallet: e.target.value }))}
                                required
                                className="flex-1"
                            />
                            <button
                                type="button"
                                onClick={handleScreenWallet}
                                disabled={screening.status === 'loading'}
                                className="btn-secondary flex items-center gap-2 whitespace-nowrap"
                            >
                                {screening.status === 'loading' ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4" />
                                )}
                                Screen
                            </button>
                        </div>

                        {screening.status === 'done' && (
                            <div className={`mt-2 p-3 rounded-lg ${screening.score >= 50 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {screening.score >= 50 ? (
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 text-red-500" />
                                        )}
                                        <span>Screening Score: {screening.score}/100</span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${screening.isMock
                                        ? 'bg-yellow-500/20 text-yellow-400'
                                        : 'bg-blue-500/20 text-blue-400'
                                        }`}>
                                        {screening.isMock ? '⚠️ Mock' : '✓ Range API'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label>Monthly Salary (USDC)</label>
                        <input
                            type="number"
                            placeholder="5000"
                            value={formData.salary}
                            onChange={e => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                            required
                            min="0"
                            step="0.01"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary flex-1"
                            disabled={screening.status !== 'done' || screening.score < 50}
                        >
                            Add Employee
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
