"use client";

import React, { useState, useEffect } from 'react';
import styles from '@/components/Room/Room.module.css'; // Reusing some room styles for simplicity

import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';

export default function ExpertValuations() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBidForm, setShowBidForm] = useState<string | null>(null);
  const [fee, setFee] = useState('');
  const [leadTime, setLeadTime] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user || (user.role !== 'Expert' && user.role !== 'Valuator')) {
      // Redirect or show empty
      // router.push('/'); 
      // For beta, just return/stop
      setIsLoading(false);
      return;
    }
    fetchRequests(user.id);
  }, [user, authLoading]);

  const fetchRequests = async (expertId: string) => {
    try {
      const res = await fetch(`/api/valuations?expertId=${expertId}`);
      if (res.ok) setRequests(await res.json());
    } finally {
      setIsLoading(false);
    }
  };

  const submitBid = async (requestId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/valuations/${requestId}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expertId: user.id, fee, leadTime, message })
      });
      if (res.ok) {
        alert("Bid submitted!");
        setShowBidForm(null);
        fetchRequests(user.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) return <div className="spinner" />;

  return (
    <div className="container" style={{ padding: '120px 20px' }}>
      <h1>Incoming <span className="gradient-text">Valuation Requests</span></h1>
      <p style={{ color: 'var(--muted)', marginBottom: '40px' }}>Respond to potential valuation jobs with your fee and lead time.</p>

      {requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px' }}>No valuation requests found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {requests.map(req => (
            <div key={req.id} className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ marginBottom: '4px' }}>{req.ipListing.title}</h3>
                  <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                    Requested by: <strong>{req.requester.name}</strong> • Status: <span style={{ color: 'var(--accent)' }}>{req.status}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase' }}>Budget</div>
                  <div style={{ fontWeight: 700 }}>{req.budget || 'Open'}</div>
                </div>
              </div>

              <p style={{ fontSize: '14px', marginBottom: '20px' }}>{req.description}</p>

              {req.bids?.length > 0 && (
                <div style={{ marginBottom: '20px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '13px', marginBottom: '12px', color: 'var(--accent)' }}>My Previous Bids</h4>
                  {req.bids.map((bid: any) => (
                    <div key={bid.id} style={{ fontSize: '13px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '4px', marginBottom: '8px' }}>
                      {bid.fee} • {bid.leadTime} • <span style={{ color: 'var(--muted)' }}>{bid.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {req.status === 'Open' && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn-primary" onClick={() => setShowBidForm(req.id)}>
                    {req.bids?.length > 0 ? 'Place New Bid' : 'Submit Bid'}
                  </button>
                </div>
              )}

              {showBidForm === req.id && (
                <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Fee (KRW)</label>
                      <input className={styles.formInput} value={fee} onChange={e => setFee(e.target.value)} placeholder="e.g. 1,500,000" />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Lead Time</label>
                      <input className={styles.formInput} value={leadTime} onChange={e => setLeadTime(e.target.value)} placeholder="e.g. 5 days" />
                    </div>
                  </div>
                  <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                    <label className={styles.formLabel}>Message to Client</label>
                    <textarea className={styles.formTextarea} value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe your methodology or experience..." />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-primary" onClick={() => submitBid(req.id)}>Confirm Bid</button>
                    <button onClick={() => setShowBidForm(null)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
