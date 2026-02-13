"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Owner');

  const handleRegister = (e: React.FormEvent) => {
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
        <h1 style={{ marginBottom: '8px', textAlign: 'center' }}>Create Account</h1>
        <p style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: '32px' }}>
          Join the Global IP Marketplace
        </p>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Email</label>
            <input
              type="email"
              placeholder="e.g. newuser@test.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-field"
              required
              style={{ padding: '12px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>I am a...</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="input-field"
              style={{ padding: '12px' }}
            >
              <option value="Owner">IP Owner (Seller)</option>
              <option value="Buyer">IP Buyer</option>
              <option value="Broker">IP Broker</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '16px' }}>
            Register
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px' }}>
          {"Already have an account? "}
          <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}
