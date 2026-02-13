"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/components/MyIP/MyIP.module.css';

interface IPListing {
  id: string;
  title: string;
  ipType: string;
  industry: string | null;
  status: string;
  visibility: string;
  priceExpectation: string | null;
  createdAt: string;
  updatedAt: string;
  rightHolders: any[];
}

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'Published', label: 'Published' },
  { id: 'Draft', label: 'Draft' },
  { id: 'Paused', label: 'Paused' },
  { id: 'Sold', label: 'Sold' },
  { id: 'Archived', label: 'Archived' },
];

import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';

export default function MyIPPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<IPListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Valuation Modal State
  const [showValuationModal, setShowValuationModal] = useState(false);
  const [selectedIpId, setSelectedIpId] = useState<string | null>(null);
  const [valuationForm, setValuationForm] = useState({ budget: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestValuation = async () => {
    if (!user || !selectedIpId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/valuations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: user.id,
          ipListingId: selectedIpId,
          budget: valuationForm.budget,
          description: valuationForm.description,
          requestType: 'OpenBid' // Default to open bid
        })
      });

      if (res.ok) {
        alert('Valuation request submitted successfully!');
        setShowValuationModal(false);
        setValuationForm({ budget: '', description: '' });
        router.push('/valuation/my-requests');
      } else {
        alert('Failed to submit request');
      }
    } catch (e) {
      console.error(e);
      alert('Error submitting request');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    async function fetchMyListings() {
      try {
        const res = await fetch('/api/ip_listings');
        if (res.ok) {
          const data = await res.json();
          setListings(data);
        }
      } catch (err) {
        console.error('Failed to fetch listings:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMyListings();
  }, []);

  const filtered = activeTab === 'all'
    ? listings
    : listings.filter(l => l.status === activeTab);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Published': return styles.statusPublished;
      case 'Draft': return styles.statusDraft;
      case 'Paused': return styles.statusPaused;
      case 'Sold': return styles.statusSold;
      case 'Archived': return styles.statusArchived;
      default: return styles.statusPublished;
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });

  const handleStatusChange = async (id: string, newStatus: string) => {
    // TODO: Implement status update API
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
  };

  const statusCounts = listings.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <main className={styles.myIpContainer}>
      <div className="container">
        {/* Header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>
            My <span className="gradient-text">IP Portfolio</span>
          </h1>
          <Link href="/ip_listings/create" className="btn-primary" style={{ padding: '12px 24px' }}>
            + Register New IP
          </Link>
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{listings.length}</div>
            <div className={styles.statLabel}>Total IPs</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{statusCounts['Published'] || 0}</div>
            <div className={styles.statLabel}>Published</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{statusCounts['Draft'] || 0}</div>
            <div className={styles.statLabel}>Drafts</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{statusCounts['Sold'] || 0}</div>
            <div className={styles.statLabel}>Sold</div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className={styles.statusTabs}>
          {STATUS_TABS.map(tab => (
            <button
              key={tab.id}
              className={`${styles.statusTab} ${activeTab === tab.id ? styles.statusTabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.id === 'all' && <span className={styles.tabCount}>{listings.length}</span>}
              {tab.id !== 'all' && statusCounts[tab.id] > 0 && (
                <span className={styles.tabCount}>{statusCounts[tab.id]}</span>
              )}
            </button>
          ))}
        </div>

      </div>

      {/* Valuation Request Modal */}
      {showValuationModal && selectedIpId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div className="fluent-card" style={{ width: '500px', padding: '32px', background: 'white' }}>
            <h2 style={{ marginBottom: '24px' }}>Request Valuation</h2>
            <p style={{ marginBottom: '24px', color: 'var(--muted)' }}>
              Request a professional valuation for <strong>{listings.find(l => l.id === selectedIpId)?.title}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Budget Range</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 1,000,000 - 3,000,000 KRW"
                  value={valuationForm.budget}
                  onChange={e => setValuationForm({ ...valuationForm, budget: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Description & Requirements</label>
                <textarea
                  className="input-field"
                  rows={4}
                  placeholder="Describe the purpose of valuation (e.g. Sale, Licensing, Internal Audit) and any specific requirements."
                  value={valuationForm.description}
                  onChange={e => setValuationForm({ ...valuationForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={handleRequestValuation}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  onClick={() => setShowValuationModal(false)}
                  style={{ flex: 1, border: '1px solid var(--card-border)', background: 'transparent', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className={styles.emptyState}>
          <p>Loading your IP portfolio...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📦</div>
          <h3 className={styles.emptyTitle}>
            {activeTab === 'all' ? 'No IP registered yet' : `No ${activeTab} IPs`}
          </h3>
          <p className={styles.emptyDesc}>
            {activeTab === 'all'
              ? 'Start by registering your first intellectual property.'
              : `You have no IPs with "${activeTab}" status.`}
          </p>
          {activeTab === 'all' && (
            <Link href="/ip_listings/create" className="btn-primary" style={{ padding: '12px 24px' }}>
              Register First IP
            </Link>
          )}
        </div>
      ) : (
        <table className={styles.ipTable}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Industry</th>
              <th>Status</th>
              <th>Rights Holders</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(listing => (
              <tr key={listing.id}>
                <td className={styles.titleCell}>
                  <Link href={`/marketplace/${listing.id}`} className={styles.titleLink}>
                    {listing.title}
                  </Link>
                </td>
                <td>{listing.ipType}</td>
                <td>{listing.industry || '—'}</td>
                <td>
                  <span className={`${styles.statusPill} ${getStatusClass(listing.status)}`}>
                    {listing.status}
                  </span>
                </td>
                <td>{listing.rightHolders?.length || 0}</td>
                <td>
                  <div className={styles.rowActions}>
                    <button
                      className={styles.actionBtn}
                      style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
                      onClick={() => {
                        setSelectedIpId(listing.id);
                        setShowValuationModal(true);
                      }}
                    >
                      ⚖️ Request Valuation
                    </button>
                    <Link href={`/marketplace/${listing.id}`}>
                      <button className={styles.actionBtn}>View</button>
                    </Link>
                    {/* Existing actions... simplified for snippet */}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
