"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';

export default function WalletSettingsPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user) fetchSettings();
  }, [user]);

  async function fetchSettings() {
    try {
      const res = await fetch(`/api/wallet?userId=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.bankProfile) {
          setFormData(data.bankProfile);
        } else {
          // Defaultholder name to user name
          setFormData(prev => ({ ...prev, accountHolder: user?.name || '' }));
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/wallet', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, bankProfile: formData })
      });
      if (res.ok) {
        router.push('/wallet'); // Redirect on success
      }
    } finally {
      setSaving(false);
    }
  }

  if (!user || loading) return <div style={{ padding: '40px' }}>Loading...</div>;

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '600px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/wallet" style={{ color: 'var(--muted)', fontSize: '14px' }}>← Back to Wallet</Link>
        <h1 style={{ marginTop: '8px' }}>Bank Settings</h1>
      </div>

      <div className="glass-card" style={{ padding: '32px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--muted)' }}>Bank Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Kookmin Bank"
              value={formData.bankName}
              onChange={e => setFormData({ ...formData, bankName: e.target.value })}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--muted)' }}>Account Number</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. 123-456-7890"
              value={formData.accountNumber}
              onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--muted)' }}>Account Holder</label>
            <input
              type="text"
              className="input-field"
              placeholder="Full Name"
              value={formData.accountHolder}
              onChange={e => setFormData({ ...formData, accountHolder: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ marginTop: '20px', width: '100%', padding: '16px' }}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Bank Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
