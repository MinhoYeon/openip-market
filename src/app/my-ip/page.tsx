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

export default function MyIPPage() {
  const [listings, setListings] = useState<IPListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

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
                <th>Listed</th>
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
                  <td style={{ color: 'var(--muted)', fontSize: '13px' }}>
                    {formatDate(listing.createdAt)}
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <Link href={`/marketplace/${listing.id}`}>
                        <button className={styles.actionBtn}>View</button>
                      </Link>
                      {listing.status === 'Published' && (
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleStatusChange(listing.id, 'Paused')}
                        >
                          Pause
                        </button>
                      )}
                      {listing.status === 'Paused' && (
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleStatusChange(listing.id, 'Published')}
                        >
                          Resume
                        </button>
                      )}
                      {(listing.status === 'Draft' || listing.status === 'Paused') && (
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          onClick={() => handleStatusChange(listing.id, 'Archived')}
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
