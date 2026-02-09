"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/components/Demand/Demand.module.css';

interface DemandSummary {
  id: string;
  title: string;
  description: string | null;
  ipTypeNeeded: string;
  industry: string | null;
  budgetRange: string | null;
  urgency: string;
  status: string;
  createdAt: string;
  requester: { id: string; name: string; role: string };
  _count: { proposals: number };
}

const IP_TYPES = ['All', 'Patent', 'Trademark', 'Design', 'Software'];

export default function DemandPage() {
  const [demands, setDemands] = useState<DemandSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [filterUrgency, setFilterUrgency] = useState('');

  useEffect(() => {
    async function fetchDemands() {
      try {
        const params = new URLSearchParams();
        if (filterType !== 'All') params.set('ipType', filterType);
        if (filterUrgency) params.set('urgency', filterUrgency);
        const res = await fetch(`/api/demand?${params}`);
        if (res.ok) setDemands(await res.json());
      } catch (err) {
        console.error('Failed to fetch demands:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDemands();
  }, [filterType, filterUrgency]);

  const getUrgencyClass = (u: string) =>
    u === 'Urgent' ? styles.urgencyUrgent : u === 'Flexible' ? styles.urgencyFlexible : styles.urgencyNormal;

  const getStatusClass = (s: string) => {
    const m: Record<string, string> = { Open: styles.statusOpen, InReview: styles.statusInReview, Matched: styles.statusMatched, Closed: styles.statusClosed };
    return m[s] || styles.statusOpen;
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });

  return (
    <main className={styles.demandContainer}>
      <div className="container">
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>
            Demand <span className="gradient-text">Marketplace</span>
          </h1>
          <Link href="/demand/create" className="btn-primary" style={{ padding: '12px 24px' }}>
            + Post Demand
          </Link>
        </div>

        {/* Filters */}
        <div className={styles.filterBar}>
          <select className={styles.filterSelect} value={filterType} onChange={e => setFilterType(e.target.value)}>
            {IP_TYPES.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
          </select>
          <select className={styles.filterSelect} value={filterUrgency} onChange={e => setFilterUrgency(e.target.value)}>
            <option value="">All Urgency</option>
            <option value="Urgent">Urgent</option>
            <option value="Normal">Normal</option>
            <option value="Flexible">Flexible</option>
          </select>
        </div>

        {isLoading ? (
          <div className={styles.spinner} />
        ) : demands.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📢</div>
            <h3 className={styles.emptyTitle}>No demands posted yet</h3>
            <p className={styles.emptyDesc}>Be the first to post a technology demand.</p>
            <Link href="/demand/create" className="btn-primary" style={{ padding: '12px 24px' }}>
              Post First Demand
            </Link>
          </div>
        ) : (
          <div className={styles.demandGrid}>
            {demands.map(d => (
              <Link key={d.id} href={`/demand/${d.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className={`glass-card ${styles.demandCard}`}>
                  <div className={styles.cardTop}>
                    <span className={`${styles.urgencyBadge} ${getUrgencyClass(d.urgency)}`}>{d.urgency}</span>
                    <span className={`${styles.statusBadge} ${getStatusClass(d.status)}`}>{d.status}</span>
                  </div>
                  <h3 className={styles.demandTitle}>{d.title}</h3>
                  {d.description && <p className={styles.demandDesc}>{d.description}</p>}
                  <div className={styles.demandMeta}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>IP Type</span>
                      <span className={styles.metaValue}>{d.ipTypeNeeded}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Budget</span>
                      <span className={styles.metaValue}>{d.budgetRange || 'Flexible'}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Proposals</span>
                      <span className={styles.metaValue}>{d._count.proposals}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Posted</span>
                      <span className={styles.metaValue}>{formatDate(d.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
