"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';

export default function MandatesPage() {
  const { user: currentUser } = useAuth();
  const [mandates, setMandates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentUser) fetchMandates();
  }, [currentUser]);

  const fetchMandates = async () => {
    try {
      const res = await fetch(`/api/mandates?userId=${currentUser?.id}`);
      if (res.ok) setMandates(await res.json());
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (id: string, action: string) => {
    try {
      const res = await fetch(`/api/mandates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) fetchMandates();
    } catch (e) { console.error(e); }
  };

  if (isLoading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading Mandates...</div>;

  return (
    <div className="container" style={{ padding: '120px 20px' }}>
      <h1>My <span className="gradient-text">Mandates & Authorizations</span></h1>
      <p style={{ color: 'var(--muted)', marginBottom: '40px' }}>Manage legal authorizations between owners and brokers.</p>

      {mandates.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
          <h3>No mandates found</h3>
          <p>Requested or received mandates will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          {mandates.map(m => {
            const isOwner = m.ownerId === currentUser?.id;
            const party = isOwner ? m.broker : m.owner;
            const scope = JSON.parse(m.scope);

            return (
              <div key={m.id} className="glass-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                      background: isOwner ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)',
                      color: isOwner ? 'var(--accent)' : '#10b981'
                    }}>
                      {isOwner ? 'MANAGING' : 'ACTING AS'}
                    </span>
                    <span style={{
                      padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                      background: m.status === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(234,179,8,0.15)',
                      color: m.status === 'Active' ? '#10b981' : '#eab308'
                    }}>
                      {m.status}
                    </span>
                  </div>
                  <h3 style={{ marginBottom: '4px' }}>{m.ipListing?.title || 'All IP Portfolio'}</h3>
                  <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
                    {isOwner ? 'Broker' : 'Owner'}: <strong>{party.name}</strong> ({party.email})
                  </div>
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    {Object.entries(scope).map(([key, val]) => (
                      val && <span key={key} style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                        ✓ {key}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  {m.status === 'Pending' && !isOwner && (
                    <>
                      <button className="btn-primary" onClick={() => handleAction(m.id, 'accept')}>Accept</button>
                      <button onClick={() => handleAction(m.id, 'reject')} style={{ color: '#ef4444' }}>Reject</button>
                    </>
                  )}
                  {m.status === 'Active' && (
                    <button onClick={() => handleAction(m.id, 'terminate')} style={{ color: '#ef4444' }}>Terminate</button>
                  )}
                  {isOwner && m.status === 'Pending' && (
                    <button onClick={() => handleAction(m.id, 'terminate')} style={{ color: 'var(--muted)' }}>Cancel Request</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
