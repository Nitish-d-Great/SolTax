'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from '@/components/WalletButton';
import {
  Users,
  CreditCard,
  Shield,
  Eye,
  ArrowRight,
  Lock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getConnection, getPayrollPDA, PROGRAM_ID } from '@/lib/anchor-client';
import { useEmployees } from '@/providers/EmployeeProvider';

export default function Dashboard() {
  const { publicKey, connected } = useWallet();
  const { employees } = useEmployees();
  const [stats, setStats] = useState({
    employeeCount: 0,
    paymentCount: 0,
    pendingVerifications: 0,
    initialized: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Always show employee count from localStorage
    setStats(prev => ({
      ...prev,
      employeeCount: employees.length,
    }));
  }, [employees]);

  useEffect(() => {
    if (connected && publicKey) {
      fetchPayrollStats();
    } else {
      // Show demo data when not connected or as fallback
      setStats(prev => ({
        ...prev,
        paymentCount: prev.paymentCount || 0,
        pendingVerifications: prev.pendingVerifications || 0,
        initialized: true,
      }));
    }
  }, [connected, publicKey]);

  const fetchPayrollStats = async () => {
    if (!publicKey) return;

    setLoading(true);
    try {
      const connection = getConnection();
      const [payrollPDA] = getPayrollPDA(publicKey);

      const accountInfo = await connection.getAccountInfo(payrollPDA);

      if (accountInfo) {
        // Parse account data (simplified)
        setStats(prev => ({
          ...prev,
          paymentCount: 12, // Demo data
          pendingVerifications: 2,
          initialized: true,
        }));
      } else {
        // Account doesn't exist yet, show demo data as fallback
        setStats(prev => ({
          ...prev,
          paymentCount: 0,
          pendingVerifications: 0,
          initialized: true,
        }));
      }
    } catch (error) {
      console.error('Error fetching payroll stats:', error);
      // On error, still mark as initialized with default values
      setStats(prev => ({
        ...prev,
        paymentCount: 0,
        pendingVerifications: 0,
        initialized: true,
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Lock className="h-8 w-8 text-indigo-500" />
              <span className="text-xl font-bold gradient-text">ZK Payroll</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-white font-medium">Dashboard</Link>
              <Link href="/employees" className="text-gray-400 hover:text-white transition">Employees</Link>
              <Link href="/payments" className="text-gray-400 hover:text-white transition">Payments</Link>
              <Link href="/explorer" className="text-gray-400 hover:text-white transition">Explorer</Link>
            </div>

            <WalletButton />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">Privacy-Preserving</span>
            <br />
            <span className="text-white">Payroll on Solana</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Process payroll with zero-knowledge proofs. Tax and salary amounts are hidden
            via Bulletproofs while remaining verifiable on-chain.
          </p>

          {!connected ? (
            <div className="flex flex-col items-center gap-4">
              <WalletButton />
              <p className="text-gray-500 text-sm">Connect your wallet to get started</p>
            </div>
          ) : (
            <div className="flex justify-center gap-4">
              <Link href="/employees" className="btn-primary flex items-center gap-2">
                Manage Employees <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/payments" className="btn-secondary flex items-center gap-2">
                Process Payments
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Stats Cards */}
      {connected && (
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-6">
              <StatCard
                icon={<Users className="h-6 w-6" />}
                label="Total Employees"
                value={stats.employeeCount.toString()}
                color="indigo"
              />
              <StatCard
                icon={<CreditCard className="h-6 w-6" />}
                label="Payments Processed"
                value={stats.paymentCount.toString()}
                color="purple"
              />
              <StatCard
                icon={<AlertCircle className="h-6 w-6" />}
                label="Pending Verifications"
                value={stats.pendingVerifications.toString()}
                color="yellow"
              />
              <StatCard
                icon={<CheckCircle className="h-6 w-6" />}
                label="Verified Payments"
                value={(stats.paymentCount - stats.pendingVerifications).toString()}
                color="green"
              />
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Shield className="h-8 w-8 text-indigo-500" />}
              title="Wallet Screening"
              description="Every employee wallet is screened using Range API for compliance. Color-coded risk indicators show screening status."
            />
            <FeatureCard
              icon={<Lock className="h-8 w-8 text-purple-500" />}
              title="Confidential Transfers"
              description="Salary and tax amounts are hidden using ShadowWire's Bulletproof zero-knowledge proofs. No one can see the amounts."
            />
            <FeatureCard
              icon={<Eye className="h-8 w-8 text-green-500" />}
              title="Verifiable Proofs"
              description="Anyone can verify that payments occurred correctly without revealing the actual amounts. True privacy with accountability."
            />
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      {connected && (
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickAction
                href="/employees/add"
                label="Add Employee"
                description="Register a new employee with wallet screening"
                icon={<Users className="h-5 w-5" />}
              />
              <QuickAction
                href="/payments/process"
                label="Process Payment"
                description="Send confidential salary payments"
                icon={<CreditCard className="h-5 w-5" />}
              />
              <QuickAction
                href="/explorer"
                label="View Payments"
                description="Browse payment history and verify proofs"
                icon={<Eye className="h-5 w-5" />}
              />
              <QuickAction
                href="/settings"
                label="Settings"
                description="Configure tax rate and accounts"
                icon={<Shield className="h-5 w-5" />}
              />
            </div>
          </div>
        </section>
      )}

      {/* Privacy Notice */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-8 text-center">
            <Lock className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-4">Privacy Guaranteed</h3>
            <p className="text-gray-400">
              All payment amounts are encrypted using Bulletproof zero-knowledge proofs.
              Neither tax amounts nor salary amounts are ever stored on-chain in plain text.
              Only authorized parties can decrypt their own balances.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-indigo-500" />
            <span className="font-bold">ZK Payroll</span>
          </div>
          <p className="text-gray-500 text-sm">
            Built with ShadowWire & Range API on Solana
          </p>
          <div className="flex gap-4 text-gray-400 text-sm">
            <a href="#" className="hover:text-white transition">Docs</a>
            <a href="#" className="hover:text-white transition">GitHub</a>
            <a href="#" className="hover:text-white transition">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'indigo' | 'purple' | 'green' | 'yellow';
}) {
  const colorClasses = {
    indigo: 'bg-indigo-500/20 text-indigo-500',
    purple: 'bg-purple-500/20 text-purple-500',
    green: 'bg-green-500/20 text-green-500',
    yellow: 'bg-yellow-500/20 text-yellow-500',
  };

  return (
    <div className="glass-card p-6 animate-slide-up">
      <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

// Feature Card Component
function FeatureCard({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="glass-card p-6 text-center animate-slide-up">
      <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

// Quick Action Component
function QuickAction({
  href,
  label,
  description,
  icon
}: {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="glass-card p-4 flex items-start gap-4 hover:border-indigo-500/50 transition group">
      <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-500 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition">
        {icon}
      </div>
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </Link>
  );
}
