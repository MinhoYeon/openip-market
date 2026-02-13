"use client";

import React, { useState, useEffect } from 'react';
import styles from '@/components/Marketplace/IPDetail.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTranslation } from '@/lib/i18n/i18n-context';

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
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  const handleCreateRoom = async (type: string, initialTab: string = 'overview') => {
    if (!user) {
      alert('Login required');
      router.push('/login');
      return;
    }
    if (!listing) return;

    // Check existing room
    try {
      const checkRes = await fetch(`/api/rooms?ipListingId=${listing.id}`);
      if (checkRes.ok) {
        const rooms = await checkRes.json();
        // Simple client-side check if user is participant (API returns all for demo, or we assume filter works)
        const myRoom = rooms.find((r: any) =>
          r.participants.some((p: any) => p.user.id === user.id)
        );

        if (myRoom) {
          router.push(`/rooms/${myRoom.id}?tab=${initialTab}`);
          return;
        }
      }

      // Create new room

      // Self-dealing check: If I am the owner, create a simulation Buyer
      const isSelfDealing = user.id === listing.ownerId;
      const participants = isSelfDealing
        ? [
          { userId: 'test-buyer-sim-id', role: 'Buyer' }, // Simulated Buyer
          { userId: listing.ownerId, role: 'Seller' }      // Me (Owner)
        ]
        : [
          { userId: user.id, role: 'Buyer' },             // Me (Buyer)
          { userId: listing.ownerId, role: 'Seller' }      // Owner
        ];

      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Deal: ${listing.title}`,
          type: 'Deal',
          ipListingId: listing.id,
          participants
        })
      });

      if (res.ok) {
        const newRoom = await res.json();
        router.push(`/rooms/${newRoom.id}?tab=${initialTab}`);
      }
    } catch (err) {
      console.error('Failed to create/join room:', err);
      alert('Error initiating deal');
    }
  };

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
            <p>{t('common.loading')}</p>
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
            <h2>{error || 'IP를 찾을 수 없습니다.'}</h2>
            <Link href="/marketplace" className="btn-primary" style={{ padding: '12px 24px' }}>
              {t('marketplace.back_to_market')}
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
    { id: 'overview', label: t('marketplace.tabs.overview') },
    { id: 'rights', label: t('marketplace.tabs.rights') },
    { id: 'licensing', label: t('marketplace.tabs.licensing') },
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
            <button
              className={`${styles.ctaButton} ${styles.ctaPrimary}`}
              onClick={() => handleCreateRoom('Deal', 'negotiation')}
            >
              {t('marketplace.actions.submit_offer')}
            </button>
            <button
              className={`${styles.ctaButton} ${styles.ctaSecondary}`}
              onClick={() => handleCreateRoom('Deal', 'documents')}
            >
              {t('marketplace.actions.request_nda')}
            </button>
            <button
              className={`${styles.ctaButton} ${styles.ctaSecondary}`}
              onClick={() => handleCreateRoom('Deal', 'messages')}
            >
              {t('marketplace.actions.contact_owner')}
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
                  <h3 className={styles.sectionTitle}>{t('marketplace.sections.summary')}</h3>
                  <div className={styles.sectionBody}>
                    {listing.summary || t('marketplace.messages.no_summary')}
                  </div>
                </div>

                {/* Technical Info */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>{t('marketplace.sections.technical')}</h3>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>{t('marketplace.fields.ip_type')}</span>
                      <span className={styles.infoValue}>{listing.ipType}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>{t('marketplace.fields.industry')}</span>
                      <span className={styles.infoValue}>{listing.industry || '—'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>{t('marketplace.fields.ipc_code')}</span>
                      <span className={styles.infoValue}>{listing.ipc || '—'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>{t('marketplace.fields.visibility')}</span>
                      <span className={styles.infoValue}>
                        {listing.visibility === 'Full' ? t('marketplace.fields.visible_full') : t('marketplace.fields.visible_teaser')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>📅 진행 이력 (Timeline)</h3>
                  <div className={styles.timeline}>
                    <div className={styles.timelineItem}>
                      <div className={styles.timelineDot} />
                      <div className={styles.timelineContent}>
                        <span className={styles.timelineLabel}>마켓플레이스 등록일</span>
                        <span className={styles.timelineDate}>{formatDate(listing.createdAt)}</span>
                      </div>
                    </div>
                    <div className={styles.timelineItem}>
                      <div className={styles.timelineDot} />
                      <div className={styles.timelineContent}>
                        <span className={styles.timelineLabel}>최종 업데이트</span>
                        <span className={styles.timelineDate}>{formatDate(listing.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'rights' && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>👥 권리자 현황 ({listing.rightHolders.length})</h3>
                {listing.rightHolders.length > 0 ? (
                  <table className={styles.holdersTable}>
                    <thead>
                      <tr>
                        <th>이름</th>
                        <th>지분율</th>
                        <th style={{ width: '40%' }}>소유권 현황</th>
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
                  <p style={{ color: 'var(--muted)' }}>등록된 권리자가 없습니다.</p>
                )}
              </div>
            )}

            {activeTab === 'licensing' && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>{t('marketplace.sections.licensing_terms')}</h3>
                <div className={styles.sectionBody}>
                  <p style={{ marginBottom: '20px' }}>
                    {t('marketplace.messages.licensing_note')}
                  </p>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>{t('marketplace.fields.exclusive')}</span>
                      <span className={styles.infoValue}>{t('marketplace.messages.available_on_request')}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>{t('marketplace.fields.non_exclusive')}</span>
                      <span className={styles.infoValue}>{t('marketplace.messages.available_on_request')}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>{t('marketplace.fields.territory')}</span>
                      <span className={styles.infoValue}>{t('marketplace.messages.available_on_request')}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>{t('marketplace.fields.royalty')}</span>
                      <span className={styles.infoValue}>{t('marketplace.messages.to_be_discussed')}</span>
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
              <div className={styles.sidebarCardTitle}>{t('marketplace.fields.price_expectation')}</div>
              <div className={styles.priceDisplay}>
                {listing.priceExpectation || t('marketplace.messages.negotiable')}
              </div>
              <div className={styles.priceNote}>
                {t('marketplace.messages.price_note')}
              </div>
            </div>

            {/* Owner Card */}
            <div className={styles.sidebarCard}>
              <div className={styles.sidebarCardTitle}>{t('marketplace.fields.listed_by')}</div>
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
              <div className={styles.sidebarCardTitle}>{t('marketplace.fields.quick_facts')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '14px' }}>{t('marketplace.sections.rights_holders')}</span>
                  <span style={{ fontWeight: 600 }}>{listing.rightHolders.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '14px' }}>{t('marketplace.fields.ip_type')}</span>
                  <span style={{ fontWeight: 600 }}>{listing.ipType}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '14px' }}>{t('marketplace.fields.listed_on')}</span>
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
