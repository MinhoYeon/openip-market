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

      <div className="fluent-card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f3f2f1', borderBottom: '1px solid #edebe9' }}>
            <tr>
              <th style={{ padding: '16px', fontWeight: 600, color: '#201f1e' }}>Policy Name</th>
              <th style={{ padding: '16px', fontWeight: 600, color: '#201f1e' }}>Fee Type</th>
              <th style={{ padding: '16px', fontWeight: 600, color: '#201f1e' }}>Rate (%)</th>
              <th style={{ padding: '16px', fontWeight: 600, color: '#201f1e' }}>Applicable To</th>
              <th style={{ padding: '16px', fontWeight: 600, color: '#201f1e' }}>Status</th>
              <th style={{ padding: '16px', fontWeight: 600, color: '#201f1e' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {policies.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #edebe9' }}>
                <td style={{ padding: '16px', fontWeight: 600, color: '#201f1e' }}>{p.name}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    background: '#f3f2f1',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#201f1e',
                    border: '1px solid #edebe9'
                  }}>
                    {p.feeType}
                  </span>
                </td>
                <td style={{ padding: '16px', color: '#201f1e' }}>{p.ratePercent ? `${p.ratePercent}%` : '-'}</td>
                <td style={{ padding: '16px', color: '#201f1e' }}>{p.applicableTo}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ color: p.isActive ? 'var(--success)' : 'var(--muted)', fontWeight: 600 }}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
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
          background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div className="fluent-card" style={{ width: '400px', padding: '32px', background: 'white', border: '1px solid #edebe9', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
            <h2 style={{ marginBottom: '24px', color: '#201f1e' }}>Create Fee Policy</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#201f1e' }}>Policy Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  style={{ background: 'white', color: '#201f1e', borderColor: '#8a8886' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#201f1e' }}>Fee Type</label>
                <select
                  value={formData.feeType}
                  onChange={e => setFormData({ ...formData, feeType: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', padding: '8px 12px', background: 'white', border: '1px solid #8a8886', color: '#201f1e', borderRadius: '0' }}
                >
                  <option value="Platform">Platform Fee</option>
                  <option value="BrokerSeller">Broker Commission (Seller)</option>
                  <option value="BrokerBuyer">Broker Commission (Buyer)</option>
                  <option value="Escrow">Escrow Fee</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#201f1e' }}>Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.ratePercent}
                    onChange={e => setFormData({ ...formData, ratePercent: e.target.value })}
                    className="input-field"
                    style={{ background: 'white', color: '#201f1e', borderColor: '#8a8886' }}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#201f1e' }}>Applicable To</label>
                  <select
                    value={formData.applicableTo}
                    onChange={e => setFormData({ ...formData, applicableTo: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', padding: '8px 12px', background: 'white', border: '1px solid #8a8886', color: '#201f1e', borderRadius: '0' }}
                  >
                    <option value="All">All Transactions</option>
                    <option value="Deal">Deal (Sale)</option>
                    <option value="License">License</option>
                    <option value="Valuation">Valuation</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #8a8886', color: '#201f1e', borderRadius: '2px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, border: 'none' }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
