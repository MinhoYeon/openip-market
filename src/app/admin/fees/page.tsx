"use client";

import React, { useState, useEffect } from 'react';

interface FeePolicy {
  id: string;
  name: string;
  feeType: string;
  ratePercent: number | null;
  applicableTo: string;
  isActive: boolean;
}

export default function FeePoliciesPage() {
  const [policies, setPolicies] = useState<FeePolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    feeType: 'Platform',
    ratePercent: '',
    applicableTo: 'All'
  });

  useEffect(() => {
    fetchPolicies();
  }, []);

  async function fetchPolicies() {
    try {
      const res = await fetch('/api/admin/fee-policies');
      if (res.ok) setPolicies(await res.json());
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/fee-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ name: '', feeType: 'Platform', ratePercent: '', applicableTo: 'All' });
        fetchPolicies();
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px' }}>Fee Policies</h1>
        <button
          className="btn-primary"
          onClick={() => setIsModalOpen(true)}
          style={{ padding: '12px 24px' }}
        >
          + New Policy
        </button>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--glass-border)' }}>
            <tr>
              <th style={{ padding: '16px' }}>Policy Name</th>
              <th style={{ padding: '16px' }}>Fee Type</th>
              <th style={{ padding: '16px' }}>Rate (%)</th>
              <th style={{ padding: '16px' }}>Applicable To</th>
              <th style={{ padding: '16px' }}>Status</th>
              <th style={{ padding: '16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {policies.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '16px', fontWeight: 600 }}>{p.name}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {p.feeType}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>{p.ratePercent ? `${p.ratePercent}%` : '-'}</td>
                <td style={{ padding: '16px' }}>{p.applicableTo}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ color: p.isActive ? 'var(--success)' : 'var(--muted)' }}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {policies.length === 0 && !isLoading && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
            No fee policies defined.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div className="glass-card" style={{ width: '400px', padding: '32px' }}>
            <h2 style={{ marginBottom: '24px' }}>Create Fee Policy</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Policy Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Fee Type</label>
                <select
                  value={formData.feeType}
                  onChange={e => setFormData({ ...formData, feeType: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px' }}
                >
                  <option value="Platform">Platform Fee</option>
                  <option value="BrokerSeller">Broker Commission (Seller)</option>
                  <option value="BrokerBuyer">Broker Commission (Buyer)</option>
                  <option value="Escrow">Escrow Fee</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.ratePercent}
                    onChange={e => setFormData({ ...formData, ratePercent: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Applicable To</label>
                  <select
                    value={formData.applicableTo}
                    onChange={e => setFormData({ ...formData, applicableTo: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px' }}
                  >
                    <option value="All">All Transactions</option>
                    <option value="Deal">Deal (Sale)</option>
                    <option value="License">License</option>
                    <option value="Valuation">Valuation</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
