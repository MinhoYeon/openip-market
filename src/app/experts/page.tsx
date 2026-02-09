"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/components/Expert/Expert.module.css';

interface ExpertSummary {
  id: string;
  expertType: string;
  specializations: string | null;
  bio: string | null;
  experience: string | null;
  hourlyRate: string | null;
  projectRate: string | null;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  availability: string;
  user: { id: string; name: string; email: string; role: string };
}

const EXPERT_TYPES = ['All', 'Valuator', 'PatentAttorney', 'Broker', 'Consultant'];

export default function ExpertsPage() {
  const [experts, setExperts] = useState<ExpertSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [filterAvail, setFilterAvail] = useState('');

  useEffect(() => {
    async function fetchExperts() {
      try {
        const params = new URLSearchParams();
        if (filterType !== 'All') params.set('type', filterType);
        if (filterAvail) params.set('availability', filterAvail);
        const res = await fetch(`/api/experts?${params}`);
        if (res.ok) setExperts(await res.json());
      } catch (err) {
        console.error('Failed to fetch experts:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchExperts();
  }, [filterType, filterAvail]);

  const getTypeClass = (t: string) => {
    const m: Record<string, string> = { Valuator: styles.typeValuator, PatentAttorney: styles.typeAttorney, Broker: styles.typeBroker, Consultant: styles.typeConsultant };
    return m[t] || styles.typeValuator;
  };

  const getAvailClass = (a: string) => {
    const m: Record<string, string> = { Available: styles.availAvailable, Busy: styles.availBusy, Unavailable: styles.availUnavailable };
    return m[a] || styles.availAvailable;
  };

  const parseSpecs = (s: string | null): string[] => {
    if (!s) return [];
    try { return JSON.parse(s); } catch { return []; }
  };

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  };

  return (
    <main className={styles.expertContainer}>
      <div className="container">
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>
            Expert <span className="gradient-text">Marketplace</span>
          </h1>
        </div>

        <div className={styles.filterBar}>
          <select className={styles.filterSelect} value={filterType} onChange={e => setFilterType(e.target.value)}>
            {EXPERT_TYPES.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t === 'PatentAttorney' ? 'Patent Attorney' : t}</option>)}
          </select>
          <select className={styles.filterSelect} value={filterAvail} onChange={e => setFilterAvail(e.target.value)}>
            <option value="">All Availability</option>
            <option value="Available">Available</option>
            <option value="Busy">Busy</option>
          </select>
        </div>

        {isLoading ? (
          <div className={styles.spinner} />
        ) : experts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👨‍💼</div>
            <h3 className={styles.emptyTitle}>No experts registered yet</h3>
            <p className={styles.emptyDesc}>Expert profiles will appear here as valuators, attorneys, and brokers join the platform.</p>
          </div>
        ) : (
          <div className={styles.expertGrid}>
            {experts.map(expert => (
              <Link key={expert.id} href={`/experts/${expert.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className={`glass-card ${styles.expertCard}`}>
                  <div className={styles.expertHeader}>
                    <div className={styles.avatar}>{expert.user.name?.charAt(0) || '?'}</div>
                    <div className={styles.expertInfo}>
                      <div className={styles.expertName}>{expert.user.name}</div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span className={`${styles.expertType} ${getTypeClass(expert.expertType)}`}>
                          {expert.expertType === 'PatentAttorney' ? 'Patent Attorney' : expert.expertType}
                        </span>
                        <span className={`${styles.availBadge} ${getAvailClass(expert.availability)}`}>
                          {expert.availability}
                        </span>
                      </div>
                    </div>
                  </div>
                  {expert.bio && <p className={styles.expertBio}>{expert.bio}</p>}
                  {parseSpecs(expert.specializations).length > 0 && (
                    <div className={styles.specTags}>
                      {parseSpecs(expert.specializations).map((s, i) => (
                        <span key={i} className={styles.specTag}>{s}</span>
                      ))}
                    </div>
                  )}
                  <div className={styles.expertStats}>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Rating</span>
                      <span className={`${styles.statValue} ${styles.rating}`}>{renderStars(expert.rating)} {expert.rating.toFixed(1)}</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Jobs</span>
                      <span className={styles.statValue}>{expert.completedJobs}</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Rate</span>
                      <span className={styles.statValue}>{expert.hourlyRate || expert.projectRate || '—'}</span>
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
