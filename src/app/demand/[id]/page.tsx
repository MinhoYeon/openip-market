"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/components/Demand/Demand.module.css';

interface DemandDetail {
  id: string;
  title: string;
  description: string | null;
  ipTypeNeeded: string;
  industry: string | null;
  budgetRange: string | null;
  urgency: string;
  status: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  requester: { id: string; name: string; email: string; role: string };
  proposals: {
    id: string; title: string; description: string; proposedPrice: string;
    status: string; createdAt: string;
    proposer: { id: string; name: string; role: string };
    ipListing: { id: string; title: string; ipType: string; priceExpectation: string } | null;
  }[];
}

import { useAuth } from '@/lib/auth/AuthContext';

export default function DemandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const [demand, setDemand] = useState<DemandDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Proposal form
  const [showForm, setShowForm] = useState(false);
  const [pTitle, setPTitle] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pIpId, setPIpId] = useState('');
  const [userListings, setUserListings] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchDemand() {
      try {
        const { id } = await params;
        const res = await fetch(`/api/demands/${id}`);
        if (res.ok) setDemand(await res.json());
      } catch (err) {
        console.error('Failed to fetch demand:', err);
      } finally {
        setIsLoading(false);
      }
    }
    async function fetchUserListings() {
      if (!user) return;
      try {
        const res = await fetch(`/api/ip_listings?ownerId=${user.id}`);
        if (res.ok) setUserListings(await res.json());
      } catch (e) { console.error(e); }
    }
    fetchDemand();
    fetchUserListings();
  }, [params, user]);

  const handleSubmitProposal = async () => {
    if (!demand || !pTitle || !user) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/demands/${demand.id}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposerId: user.id,
          title: pTitle,
          description: pDesc,
          proposedPrice: pPrice,
          ipListingId: pIpId || null
        })
      });
      if (res.ok) {
        const newProposal = await res.json();
        setDemand(prev => prev ? { ...prev, proposals: [newProposal, ...prev.proposals], status: prev.status === 'Open' ? 'InReview' : prev.status } : prev);
        setPTitle(''); setPDesc(''); setPPrice('');
        setShowForm(false);
      }
    } catch (err) {
      console.error('Failed to submit proposal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Counter form state
  const [counterProposalId, setCounterProposalId] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterTerms, setCounterTerms] = useState('');
  const [counterMsg, setCounterMsg] = useState('');

  const handleProposalAction = async (proposalId: string, action: string) => {
    if (action === 'accept') {
      try {
        const res = await fetch(`/api/proposals/${proposalId}/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomType: 'Deal' })
        });
        if (res.ok) {
          const result = await res.json();
          // Navigate to the new Room
          window.location.href = `/rooms/${result.room.id}`;
        }
      } catch (err) { console.error('Accept failed:', err); }
    } else if (action === 'reject') {
      try {
        const res = await fetch(`/api/proposals/${proposalId}/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        if (res.ok) {
          setDemand(prev => prev ? {
            ...prev,
            proposals: prev.proposals.map(p => p.id === proposalId ? { ...p, status: 'Rejected' } : p)
          } : prev);
        }
      } catch (err) { console.error('Reject failed:', err); }
    } else if (action === 'counter') {
      setCounterProposalId(proposalId);
    } else if (action === 'Shortlisted') {
      // Keep local-only shortlist for now (no separate API yet)
      setDemand(prev => prev ? {
        ...prev,
        proposals: prev.proposals.map(p => p.id === proposalId ? { ...p, status: 'Shortlisted' } : p)
      } : prev);
    }
  };

  const handleCounterSubmit = async () => {
    if (!counterProposalId) return;
    try {
      const res = await fetch(`/api/proposals/${counterProposalId}/counter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counterPrice, counterTerms, message: counterMsg })
      });
      if (res.ok) {
        setDemand(prev => prev ? {
          ...prev,
          proposals: prev.proposals.map(p => p.id === counterProposalId ? { ...p, status: 'UnderReview' } : p)
        } : prev);
        setCounterProposalId(null);
        setCounterPrice(''); setCounterTerms(''); setCounterMsg('');
      }
    } catch (err) { console.error('Counter failed:', err); }
  };

  if (isLoading) return <main className={styles.detailContainer}><div className="container"><div className={styles.spinner} /></div></main>;
  if (!demand) return <main className={styles.detailContainer}><div className="container"><div className={styles.emptyState}><h3>Demand not found</h3></div></div></main>;

  const getUrgencyClass = (u: string) =>
    u === 'Urgent' ? styles.urgencyUrgent : u === 'Flexible' ? styles.urgencyFlexible : styles.urgencyNormal;
  const getStatusClass = (s: string) => {
    const m: Record<string, string> = { Open: styles.statusOpen, InReview: styles.statusInReview, Matched: styles.statusMatched, Closed: styles.statusClosed };
    return m[s] || styles.statusOpen;
  };
  const getPStatusClass = (s: string) => {
    const m: Record<string, string> = { Submitted: styles.pStatusSubmitted, Shortlisted: styles.pStatusShortlisted, Accepted: styles.pStatusAccepted, Rejected: styles.pStatusRejected, UnderReview: styles.pStatusShortlisted };
    return m[s] || styles.pStatusSubmitted;
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <main className={styles.detailContainer}>
      <div className="container">
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link href="/demand">Demand</Link>
          <span>›</span>
          <span>{demand.ipTypeNeeded}</span>
          <span>›</span>
          <span style={{ color: 'var(--foreground)' }}>{demand.title}</span>
        </div>

        {/* Header */}
        <div className={styles.detailHeader}>
          <div>
            <h1 className={styles.detailTitle}>{demand.title}</h1>
            <div className={styles.badges}>
              <span className={`${styles.urgencyBadge} ${getUrgencyClass(demand.urgency)}`}>{demand.urgency}</span>
              <span className={`${styles.statusBadge} ${getStatusClass(demand.status)}`}>{demand.status}</span>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : '📨 Submit Proposal'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={styles.detailLayout}>
          <div>
            {/* Description */}
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>📋 Requirements</h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '15px', marginBottom: '20px' }}>
                {demand.description || 'No detailed requirements provided.'}
              </p>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>IP Type Needed</span>
                  <span className={styles.infoValue}>{demand.ipTypeNeeded}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Industry</span>
                  <span className={styles.infoValue}>{demand.industry || '—'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Budget Range</span>
                  <span className={styles.infoValue}>{demand.budgetRange || 'Flexible'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Posted</span>
                  <span className={styles.infoValue}>{formatDate(demand.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Proposal Form */}
            {showForm && (
              <div className={styles.panel}>
                <h3 className={styles.panelTitle}>📨 Submit Your Proposal</h3>
                <div className={styles.proposalForm}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Proposal Title</label>
                    <input className={styles.formInput} placeholder="e.g., AI-based Image Recognition Patent" value={pTitle} onChange={e => setPTitle(e.target.value)} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Description</label>
                    <textarea className={styles.formTextarea} placeholder="Describe how your IP matches this demand..." value={pDesc} onChange={e => setPDesc(e.target.value)} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Proposed Price</label>
                    <input className={styles.formInput} placeholder="e.g., 200M KRW" value={pPrice} onChange={e => setPPrice(e.target.value)} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Link Existing IP (Optional)</label>
                    <select className={styles.formInput} value={pIpId} onChange={e => setPIpId(e.target.value)}>
                      <option value="">-- No Linked IP --</option>
                      {userListings.map(ip => (
                        <option key={ip.id} value={ip.id}>{ip.title} ({ip.ipType})</option>
                      ))}
                    </select>
                  </div>
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                    onClick={handleSubmitProposal}
                    disabled={isSubmitting || !pTitle}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
                  </button>
                </div>
              </div>
            )}

            {/* Proposals */}
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>📬 Proposals ({demand.proposals.length})</h3>
              {demand.proposals.length === 0 ? (
                <div className={styles.emptyState} style={{ padding: '40px 20px' }}>
                  <div className={styles.emptyIcon}>💡</div>
                  <h3 className={styles.emptyTitle}>No proposals yet</h3>
                  <p className={styles.emptyDesc}>Be the first to submit a matching IP proposal.</p>
                </div>
              ) : (
                <div className={styles.proposalList}>
                  {demand.proposals.map(p => (
                    <div key={p.id} className={styles.proposalCard}>
                      <div className={styles.proposalHeader}>
                        <span className={styles.proposalTitle}>{p.title}</span>
                        <span className={`${styles.proposalStatus} ${getPStatusClass(p.status)}`}>{p.status}</span>
                      </div>
                      {p.description && <p className={styles.proposalDesc}>{p.description}</p>}
                      {p.ipListing && (
                        <Link href={`/marketplace/${p.ipListing.id}`} style={{ fontSize: '13px', color: 'var(--accent)', marginBottom: '12px', display: 'block' }}>
                          🔗 Linked IP: {p.ipListing.title} ({p.ipListing.ipType})
                        </Link>
                      )}

                      {/* Counter Form (inline) */}
                      {counterProposalId === p.id && (
                        <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', margin: '12px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <span style={{ fontWeight: 600, fontSize: '13px' }}>📝 카운터 제안</span>
                          <input className={styles.formInput} placeholder="Counter Price (e.g., 150M KRW)" value={counterPrice} onChange={e => setCounterPrice(e.target.value)} />
                          <input className={styles.formInput} placeholder="Terms (e.g., 독점, 3년)" value={counterTerms} onChange={e => setCounterTerms(e.target.value)} />
                          <input className={styles.formInput} placeholder="Message" value={counterMsg} onChange={e => setCounterMsg(e.target.value)} />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={handleCounterSubmit}>제출</button>
                            <button className={styles.actionBtn} onClick={() => setCounterProposalId(null)}>취소</button>
                          </div>
                        </div>
                      )}

                      <div className={styles.proposalFooter}>
                        <div>
                          <span style={{ color: 'var(--muted)', fontSize: '13px' }}>{p.proposer.name} ({p.proposer.role})</span>
                          <span style={{ color: 'var(--muted)', fontSize: '12px', marginLeft: '12px' }}>{formatDate(p.createdAt)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {p.proposedPrice && <span className={styles.proposalPrice}>{p.proposedPrice}</span>}

                          {/* Submitted: Shortlist / Counter / Reject */}
                          {p.status === 'Submitted' && (
                            <div className={styles.proposalActions}>
                              <button className={styles.actionBtn} onClick={() => handleProposalAction(p.id, 'Shortlisted')}>⭐ Shortlist</button>
                              <button className={styles.actionBtn} onClick={() => handleProposalAction(p.id, 'counter')}>↩ Counter</button>
                              <button className={styles.actionBtn} onClick={() => handleProposalAction(p.id, 'reject')} style={{ color: '#ef4444' }}>✕ Reject</button>
                            </div>
                          )}

                          {/* Shortlisted: Accept→Room / Counter / Reject */}
                          {p.status === 'Shortlisted' && (
                            <div className={styles.proposalActions}>
                              <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => handleProposalAction(p.id, 'accept')}>
                                ✓ Accept → Room
                              </button>
                              <button className={styles.actionBtn} onClick={() => handleProposalAction(p.id, 'counter')}>↩ Counter</button>
                              <button className={styles.actionBtn} onClick={() => handleProposalAction(p.id, 'reject')} style={{ color: '#ef4444' }}>✕</button>
                            </div>
                          )}

                          {/* Accepted — show room badge */}
                          {p.status === 'Accepted' && (
                            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>✓ Room 생성됨</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>👤 Requester</h3>
              <div className={styles.requesterInfo}>
                <div className={styles.avatar}>{demand.requester.name?.charAt(0) || '?'}</div>
                <div className={styles.requesterDetails}>
                  <span className={styles.requesterName}>{demand.requester.name}</span>
                  <span className={styles.requesterRole}>{demand.requester.role}</span>
                </div>
              </div>
            </div>

            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>📊 Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Total Proposals</span>
                  <span style={{ fontWeight: 600 }}>{demand.proposals.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Shortlisted</span>
                  <span style={{ fontWeight: 600, color: '#eab308' }}>{demand.proposals.filter(p => p.status === 'Shortlisted').length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Accepted</span>
                  <span style={{ fontWeight: 600, color: '#10b981' }}>{demand.proposals.filter(p => p.status === 'Accepted').length}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
