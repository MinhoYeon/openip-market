"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ExpertProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { user: currentUser } = useAuth();
  const [expert, setExpert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [selectedListing, setSelectedListing] = useState('');
  const [message, setMessage] = useState('');
  const [valuationModal, setValuationModal] = useState(false);
  const [vBudget, setVBudget] = useState('');
  const [resolvingParams, setResolvingParams] = useState(true);
  const [expertId, setExpertId] = useState<string>('');

  useEffect(() => {
    params.then(p => {
      setExpertId(p.id);
      setResolvingParams(false);
    });
  }, [params]);

  useEffect(() => {
    if (expertId) fetchExpert();
  }, [expertId]);

  async function fetchExpert() {
    try {
      const res = await fetch(`/api/experts/${expertId}`);
      if (res.ok) setExpert(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function openMandateModal() {
    if (!currentUser) {
      alert("Please login first");
      return;
    }
    setShowModal(true);
    // Fetch my listings
    const res = await fetch(`/api/ip_listings?ownerId=${currentUser.id}`);
    if (res.ok) setMyListings(await res.json());
  }

  async function submitMandate() {
    if (!selectedListing) return alert("Select an IP Listing");

    const res = await fetch('/api/mandates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerId: currentUser?.id,
        brokerId: expertId,
        ipListingId: selectedListing,
        message
      })
    });

    if (res.ok) {
      alert("Mandate request sent!");
      setShowModal(false);
    } else {
      const err = await res.json();
      alert("Error: " + err.error);
    }
  }

  async function openValuationModal() {
    if (!currentUser) return alert("Please login first");
    setValuationModal(true);
    // Fetch my listings
    const res = await fetch(`/api/ip_listings?ownerId=${currentUser.id}`);
    if (res.ok) setMyListings(await res.json());
  }

  async function submitValuation() {
    if (!selectedListing) return alert("Select an IP Listing");
    const res = await fetch('/api/valuations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requesterId: currentUser?.id,
        expertId: expertId,
        ipListingId: selectedListing,
        description: message,
        budget: vBudget,
        requestType: 'DirectRequest'
      })
    });
    if (res.ok) {
      alert("Valuation request sent!");
      setValuationModal(false);
    } else {
      alert("Error submitting request.");
    }
  }

  if (loading || resolvingParams) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading Expert...</div>;
  if (!expert) return <div style={{ padding: '100px', textAlign: 'center' }}>Expert not found.</div>;

  const { user, profile, listings } = expert;
  const specialties = profile?.specializations ? JSON.parse(profile.specializations) : [];
  const isBroker = profile?.expertType === 'Broker' || user.role === 'Broker';

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '1000px' }}>
      {/* Header Profile */}
      <div className="glass-card" style={{ padding: '40px', display: 'flex', gap: '40px', alignItems: 'start', marginBottom: '40px' }}>
        <div style={{
          width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px',
          border: '1px solid var(--glass-border)'
        }}>
          {user.name?.[0]}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h1 style={{ marginBottom: '8px', fontSize: '32px' }}>{user.name}</h1>
              <div style={{ color: 'var(--muted)', marginBottom: '16px', fontSize: '16px' }}>
                {profile?.expertType || user.role}
                <span style={{ color: 'var(--warning)', marginLeft: '8px' }}>★ {profile?.rating || 0}</span>
                <span style={{ margin: '0 8px' }}>•</span>
                {profile?.reviewCount || 0} Reviews
              </div>
            </div>
            {currentUser?.id !== user.id && isBroker && (
              <button className="btn-primary" onClick={openMandateModal}>
                Request Mandate
              </button>
            )}
            {currentUser?.id !== user.id && !isBroker && (
              <button className="btn-primary" onClick={openValuationModal}>
                Request Valuation
              </button>
            )}
          </div>

          <p style={{ lineHeight: 1.6, marginBottom: '24px', maxWidth: '700px', color: 'var(--foreground)' }}>
            {profile?.bio || 'No biography available for this expert.'}
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {specialties.map((tag: string) => (
              <span key={tag} style={{
                padding: '4px 12px', borderRadius: '20px',
                background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent)', fontSize: '14px',
                border: '1px solid rgba(99, 102, 241, 0.2)'
              }}>
                {tag}
              </span>
            ))}
          </div>

          <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Experience</div>
              <div style={{ fontWeight: 600 }}>{profile?.experience || '-'}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Jobs Completed</div>
              <div style={{ fontWeight: 600 }}>{profile?.completedJobs || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Listings managed by this Expert */}
      {listings && listings.length > 0 && (
        <>
          <h3 style={{ marginBottom: '24px' }}>Managed Listings ({listings.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {listings.map((item: any) => (
              <Link href={`/marketplace/${item.id}`} key={item.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="glass-card" style={{ padding: '24px', height: '100%', transition: 'transform 0.2s' }}>
                  <div style={{ fontSize: '12px', color: 'var(--accent)', marginBottom: '8px', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.ipType}</span>
                    {item.isBrokered && <span style={{ color: 'var(--muted)' }}>Brokered</span>}
                  </div>
                  <h4 style={{ marginBottom: '12px', fontSize: '18px' }}>{item.title}</h4>
                  <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.5 }}>
                    {item.summary?.substring(0, 100)}...
                  </p>
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)', fontSize: '14px', fontWeight: 600 }}>
                    {item.priceExpectation || 'Negotiable'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {(!listings || listings.length === 0) && isBroker && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>No active listings.</div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass-card" style={{ width: '500px', padding: '32px' }}>
            <h3 style={{ marginBottom: '24px' }}>Delegate to {user.name}</h3>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Select from your IP Portfolio</label>
              <select
                className="input-field"
                value={selectedListing}
                onChange={e => setSelectedListing(e.target.value)}
                style={{ background: 'black' }} // Override for select visibility
              >
                <option value="">-- Choose IP --</option>
                {myListings.map(l => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Message to Broker</label>
              <textarea
                className="input-field"
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe your goals (e.g. licensing, sale)..."
              />
            </div>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
              <button
                className="glass-card"
                style={{ padding: '12px 24px', cursor: 'pointer' }}
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={submitMandate}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Valuation Modal */}
      {valuationModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass-card" style={{ width: '500px', padding: '32px' }}>
            <h3 style={{ marginBottom: '24px' }}>Request Valuation from {user.name}</h3>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>IP Listing to Value</label>
              <select className="input-field" value={selectedListing} onChange={e => setSelectedListing(e.target.value)} style={{ background: 'black' }}>
                <option value="">-- Choose IP --</option>
                {myListings.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Budget (Expected)</label>
              <input className="input-field" value={vBudget} onChange={e => setVBudget(e.target.value)} placeholder="e.g. 2,000,000 KRW" />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Specific Requirements</label>
              <textarea className="input-field" rows={4} value={message} onChange={e => setMessage(e.target.value)} placeholder="Goal: Technical valuation for licensing..." />
            </div>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
              <button className="glass-card" style={{ padding: '12px 24px', cursor: 'pointer' }} onClick={() => setValuationModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={submitValuation}>Submit Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
