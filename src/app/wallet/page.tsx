"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';

interface WalletData {
  summary: { income: number; expense: number; pending: number };
  settlements: any[];
  bankProfile: { bankName: string; accountNumber: string; accountHolder: string } | null;
}

export default function WalletPage() {
  const { user } = useAuth();
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchWallet();
  }, [user]);

  async function fetchWallet() {
    try {
      const res = await fetch(`/api/wallet?userId=${user?.id}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (val: number) => `₩${val.toLocaleString()}`;

  if (!user) return <div style={{ padding: '40px' }}>Please log in.</div>;
  if (loading) return <div style={{ padding: '40px' }}>Loading wallet...</div>;

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px' }}>My Wallet</h1>
        <Link href="/wallet/settings" className="btn-primary" style={{ textDecoration: 'none' }}>
          ⚙️ Bank Settings
        </Link>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '8px' }}>Total Income</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--success)' }}>
            {formatCurrency(data?.summary.income || 0)}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '8px' }}>Pending (Receivable)</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--warning)' }}>
            {formatCurrency(data?.summary.pending || 0)}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '8px' }}>Total Expenses</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--foreground)' }}>
            {formatCurrency(data?.summary.expense || 0)}
          </div>
        </div>
      </div>

      {/* Bank Profile Summary */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ marginBottom: '8px' }}>Bank Account</h3>
          {data?.bankProfile ? (
            <div style={{ color: 'var(--muted)' }}>
              {data.bankProfile.bankName} • {data.bankProfile.accountNumber} • {data.bankProfile.accountHolder}
            </div>
          ) : (
            <div style={{ color: 'var(--warning)' }}>No bank account linked.</div>
          )}
        </div>
        {!data?.bankProfile && <Link href="/wallet/settings" style={{ color: 'var(--accent)' }}>Link Now →</Link>}
      </div>

      {/* Transaction History */}
      <h3 style={{ marginBottom: '24px' }}>Transaction History</h3>
      <div className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--glass-border)' }}>
            <tr>
              <th style={{ padding: '16px' }}>Date</th>
              <th style={{ padding: '16px' }}>Type</th>
              <th style={{ padding: '16px' }}>Counterparty</th>
              <th style={{ padding: '16px' }}>Amount</th>
              <th style={{ padding: '16px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {data?.settlements.map((s: any) => {
              const isPayee = s.payeeId === user.id;
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '16px', color: 'var(--muted)' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '16px' }}>{s.paymentType}</td>
                  <td style={{ padding: '16px' }}>
                    {isPayee ? `From: ${s.payer.name}` : `To: ${s.payee.name}`}
                  </td>
                  <td style={{ padding: '16px', fontWeight: 600, color: isPayee ? 'var(--success)' : 'var(--foreground)' }}>
                    {isPayee ? '+' : '-'}{s.amount}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
                      background: s.status === 'Paid' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: s.status === 'Paid' ? 'var(--success)' : 'var(--warning)'
                    }}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {data?.settlements.length === 0 && (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>No transactions found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
