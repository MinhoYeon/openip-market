"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Owner');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, role as any);
    router.push('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <div className="glass-card" style={{ width: '400px', padding: '40px', background: 'white' }}>
        <h1 style={{ marginBottom: '8px', textAlign: 'center' }}>Welcome Back</h1>
        <p style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: '32px' }}>
          Sign in to OpenIP Market
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Email</label>
            <input
              type="email"
              placeholder="e.g. seller@test.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-field"
              required
              style={{ padding: '12px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Role (Test Mode)</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="input-field"
              style={{ padding: '12px' }}
            >
              <option value="Owner">Owner (Seller)</option>
              <option value="Buyer">Buyer</option>
              <option value="Broker">Broker</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '16px' }}>
            Sign In
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px' }}>
          {"Don't have an account? "}
          <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create one</Link>
        </div>

        <div style={{ marginTop: '24px', padding: '16px', background: '#f8f9fa', borderRadius: '8px', fontSize: '12px', color: 'var(--muted)' }}>
          <strong>Test Credentials:</strong><br />
          Seller: seller@test.com (Owner)<br />
          Buyer: buyer@test.com (Buyer)<br />
          Admin: admin@openip.com (Admin)
        </div>
      </div>
    </div>
  );
}
