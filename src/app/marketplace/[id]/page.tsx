"use client";

import React, { useState, useEffect } from 'react';
import styles from '@/components/Marketplace/IPDetail.module.css';
import Link from 'next/link';

interface RightHolder {
  id: string;
  name: string;
  sharePercent: number;
}

interface Owner {
  name: string;
  role: string;
  email: string;
}

interface IPDetail {
  id: string;
  title: string;
  summary: string | null;
  ipType: string;
  industry: string | null;
  ipc: string | null;
  visibility: string;
  status: string;
  priceExpectation: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  rightHolders: RightHolder[];
  owner: Owner;
}

export default function IPDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [listing, setListing] = useState<IPDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    async function fetchListing() {
      try {
        const { id } = await params;
        const res = await fetch(`/api/ip_listings/${id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error('IP Listing not found');
          throw new Error('Failed to fetch listing');
        }
        const data = await res.json();
        setListing(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchListing();
  }, [params]);

  if (isLoading) {
    return (
      <main className={styles.detailContainer}>
        <div className="container">
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p>Loading IP details...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main className={styles.detailContainer}>
        <div className="container">
          <div className={styles.loadingContainer}>
            <p style={{ fontSize: '48px' }}>🔍</p>
            <h2>{error || 'IP not found'}</h2>
            <Link href="/marketplace" className="btn-primary" style={{ padding: '12px 24px' }}>
              Back to Marketplace
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const getStatusClass = (status: string) => {
    if (status === 'Published') return styles.badgeStatus;
    if (status === 'Paused' || status === 'Draft') return styles.badgeStatusPaused;
    return styles.badgeStatus;
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'rights', label: 'Rights Holders' },
    { id: 'licensing', label: 'Licensing Terms' },
  ];

  return (
    <main className={styles.detailContainer}>
      <div className="container">
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link href="/marketplace">Marketplace</Link>
          <span>›</span>
          <span>{listing.ipType}</span>
          <span>›</span>
          <span style={{ color: 'var(--foreground)' }}>{listing.title}</span>
        </div>

        {/* Header */}
        <div className={styles.detailHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.detailTitle}>{listing.title}</h1>
            <div className={styles.metaRow}>
              <span className={`${styles.badge} ${styles.badgeType}`}>{listing.ipType}</span>
              <span className={`${styles.badge} ${getStatusClass(listing.status)}`}>
                {listing.status === 'Published' ? '● Available' : listing.status}
              </span>
              <span className={`${styles.badge} ${styles.badgeVisibility}`}>
                {listing.visibility === 'Full' ? '🔓 Public' : '🔒 NDA Required'}
              </span>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button className={`${styles.ctaButton} ${styles.ctaPrimary}`}>
              Submit Offer
            </button>
            <button className={`${styles.ctaButton} ${styles.ctaSecondary}`}>
              Request NDA
            </button>
            <button className={`${styles.ctaButton} ${styles.ctaSecondary}`}>
              Contact Owner
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabBar}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={styles.contentLayout}>
          <div className={styles.mainContent}>
            {activeTab === 'overview' && (
              <>
                {/* Summary */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>📋 Executive Summary</h3>
                  <div className={styles.sectionBody}>
                    {listing.summary || 'No summary provided.'}
                  </div>
                </div>

                {/* Technical Info */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>🔬 Technical Classification</h3>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>IP Type</span>
                      <span className={styles.infoValue}>{listing.ipType}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Industry</span>
                      <span className={styles.infoValue}>{listing.industry || '—'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>IPC/CPC Code</span>
                      <span className={styles.infoValue}>{listing.ipc || '—'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Visibility</span>
                      <span className={styles.infoValue}>
                        {listing.visibility === 'Full' ? 'Public Display' : 'Teaser Only (NDA Required)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>📅 Timeline</h3>
                  <div className={styles.timeline}>
                    <div className={styles.timelineItem}>
                      <div className={styles.timelineDot} />
                      <div className={styles.timelineContent}>
                        <span className={styles.timelineLabel}>Listed on Marketplace</span>
                        <span className={styles.timelineDate}>{formatDate(listing.createdAt)}</span>
                      </div>
                    </div>
                    <div className={styles.timelineItem}>
                      <div className={styles.timelineDot} />
                      <div className={styles.timelineContent}>
                        <span className={styles.timelineLabel}>Last Updated</span>
                        <span className={styles.timelineDate}>{formatDate(listing.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'rights' && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>👥 Rights Holders ({listing.rightHolders.length})</h3>
                {listing.rightHolders.length > 0 ? (
                  <table className={styles.holdersTable}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Share</th>
                        <th style={{ width: '40%' }}>Ownership</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listing.rightHolders.map(holder => (
                        <tr key={holder.id}>
                          <td style={{ fontWeight: 500 }}>{holder.name}</td>
                          <td>{holder.sharePercent}%</td>
                          <td>
                            <div className={styles.shareBar}>
                              <div
                                className={styles.shareBarFill}
                                style={{ width: `${holder.sharePercent}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: 'var(--muted)' }}>No rights holders listed.</p>
                )}
              </div>
            )}

            {activeTab === 'licensing' && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>📜 Licensing Terms</h3>
                <div className={styles.sectionBody}>
                  <p style={{ marginBottom: '20px' }}>
                    Licensing terms are available after establishing a Deal Room.
                    Submit an offer or request an NDA to begin the negotiation process.
                  </p>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Exclusive License</span>
                      <span className={styles.infoValue}>Available upon request</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Non-Exclusive License</span>
                      <span className={styles.infoValue}>Available upon request</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Territory</span>
                      <span className={styles.infoValue}>Negotiable</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Royalty Model</span>
                      <span className={styles.infoValue}>To be discussed</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            {/* Price Card */}
            <div className={styles.sidebarCard}>
              <div className={styles.sidebarCardTitle}>Price Expectation</div>
              <div className={styles.priceDisplay}>
                {listing.priceExpectation || 'Negotiable'}
              </div>
              <div className={styles.priceNote}>
                Final price is subject to negotiation
              </div>
            </div>

            {/* Owner Card */}
            <div className={styles.sidebarCard}>
              <div className={styles.sidebarCardTitle}>Listed By</div>
              <div className={styles.ownerInfo}>
                <div className={styles.ownerAvatar}>
                  {listing.owner.name?.charAt(0) || '?'}
                </div>
                <div className={styles.ownerDetails}>
                  <span className={styles.ownerName}>{listing.owner.name || 'Anonymous'}</span>
                  <span className={styles.ownerRole}>{listing.owner.role}</span>
                </div>
              </div>
            </div>

            {/* Quick Facts */}
            <div className={styles.sidebarCard}>
              <div className={styles.sidebarCardTitle}>Quick Facts</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '14px' }}>Rights Holders</span>
                  <span style={{ fontWeight: 600 }}>{listing.rightHolders.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '14px' }}>IP Type</span>
                  <span style={{ fontWeight: 600 }}>{listing.ipType}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '14px' }}>Listed</span>
                  <span style={{ fontWeight: 600 }}>{formatDate(listing.createdAt)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
