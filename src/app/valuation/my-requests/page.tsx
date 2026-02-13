"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import Link from 'next/link';

export default function MyValuationRequests() {
  const { user, isLoading: authLoading } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      const fetchRequests = async () => {
        try {
          const res = await fetch(`/api/valuations?requesterId=${user.id}`);
          if (res.ok) {
            const data = await res.json();
            setRequests(data);
          }
        } finally {
          setIsLoading(false);
        }
      };
      fetchRequests();
    } else {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  const handleAcceptBid = async (requestId: string, bidId: string) => {
    if (!confirm('Accept this bid? A Deal Room will be created.')) return;
    if (!user) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/valuations/${requestId}/accept-bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId: bidId, requesterId: user.id })
      });

      const data = await res.json();

      if (res.ok && data.roomId) {
        window.location.href = `/rooms/${data.roomId}`;
      } else {
        alert('Failed to accept bid: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      console.error(e);
      alert('Network error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading || isLoading) return <div className="container" style={{ padding: '100px' }}>Loading...</div>;

  return (
    <div className="container" style={{ padding: '120px 20px', minHeight: '80vh' }}>
      <h1 style={{ marginBottom: '40px' }}>My <span className="gradient-text">Valuation Requests</span></h1>

      {requests.length === 0 ? (
        <div className="fluent-card" style={{ padding: '60px', textAlign: 'center' }}>
          <h3>No requests found</h3>
          <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>You haven't requested any IP valuations yet.</p>
          <Link href="/experts" className="btn-primary">Find Experts</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {requests.map(req => (
            <div key={req.id} className="fluent-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '18px' }}>{req.ipListing.title}</h3>
                  <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                    Posted on {new Date(req.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <span className={`status-badge ${req.status === 'Open' ? 'status-open' : 'status-closed'}`}>
                    {req.status}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '14px', color: 'var(--foreground)' }}>{req.description}</p>
                <div style={{ fontSize: '13px', marginTop: '8px' }}>
                  <strong>Budget:</strong> {req.budget || 'Open'}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>
                  Received Bids ({req.bids ? req.bids.length : 0})
                </h4>

                {(!req.bids || req.bids.length === 0) ? (
                  <div style={{ fontSize: '13px', color: 'var(--muted)' }}>No bids yet.</div>
                ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {req.bids.map((bid: any) => (
                      <div key={bid.id} style={{
                        background: 'var(--surface)',
                        padding: '12px',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>{bid.expert.name}</div>
                          <div style={{ fontSize: '13px' }}>
                            Fee: <strong>{bid.fee}</strong> • Lead Time: {bid.leadTime}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>"{bid.message}"</div>
                        </div>

                        <div>
                          {bid.status === 'Submitted' && req.status === 'Open' && (
                            <button
                              className="btn-primary"
                              style={{ fontSize: '12px', padding: '6px 12px' }}
                              onClick={() => handleAcceptBid(req.id, bid.id)}
                              disabled={isProcessing}
                            >
                              Accept
                            </button>
                          )}
                          {bid.status === 'Accepted' && (
                            <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '12px' }}>✓ Accepted</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
