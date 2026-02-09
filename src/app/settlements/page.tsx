"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/components/Settlement/Settlement.module.css';

interface SettlementItem {
  id: string;
  amount: string;
  currency: string;
  paymentType: string;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
  transactionRef: string | null;
  note: string | null;
  createdAt: string;
  room: { id: string; title: string; type: string; status: string };
  license: { id: string; licenseType: string; status: string } | null;
  payer: { id: string; name: string; role: string };
  payee: { id: string; name: string; role: string };
}

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'Pending', label: 'Pending' },
  { id: 'Processing', label: 'Processing' },
  { id: 'Completed', label: 'Completed' },
  { id: 'Failed', label: 'Failed' },
];

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<SettlementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('all');

  useEffect(() => {
    async function fetchSettlements() {
      try {
        const res = await fetch('/api/settlements');
        if (res.ok) setSettlements(await res.json());
      } catch (err) {
        console.error('Failed to fetch settlements:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettlements();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/settlements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setSettlements(prev => prev.map(s => s.id === id ? { ...s, status: updated.status, paidAt: updated.paidAt } : s));
      }
    } catch (err) {
      console.error('Failed to update settlement:', err);
    }
  };

  const filtered = activeStatus === 'all'
    ? settlements
    : settlements.filter(s => s.status === activeStatus);

  const getStatusClass = (s: string) => {
    const m: Record<string, string> = {
      Pending: styles.stPending,
      Processing: styles.stProcessing,
      Completed: styles.stCompleted,
      Failed: styles.stFailed,
      Refunded: styles.stRefunded,
    };
    return m[s] || styles.stPending;
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '—';

  // Stats
  const totalAmount = settlements.reduce((sum, s) => {
    const num = parseInt(s.amount.replace(/[^0-9]/g, ''), 10);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
  const pendingCount = settlements.filter(s => s.status === 'Pending').length;
  const completedCount = settlements.filter(s => s.status === 'Completed').length;

  const statusCounts = settlements.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <main className={styles.settContainer}>
      <div className="container">
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>
            Settlement <span className="gradient-text">Dashboard</span>
          </h1>
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{settlements.length}</div>
            <div className={styles.statLabel}>Total Settlements</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{pendingCount}</div>
            <div className={styles.statLabel}>Pending</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{completedCount}</div>
            <div className={styles.statLabel}>Completed</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{totalAmount > 0 ? `${(totalAmount / 100000000).toFixed(1)}억` : '—'}</div>
            <div className={styles.statLabel}>Total Volume</div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {STATUS_TABS.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeStatus === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveStatus(tab.id)}
            >
              {tab.label}
              {tab.id === 'all'
                ? <span className={styles.tabBadge}>{settlements.length}</span>
                : statusCounts[tab.id] > 0 && <span className={styles.tabBadge}>{statusCounts[tab.id]}</span>
              }
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className={styles.spinner} />
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>💰</div>
            <h3 className={styles.emptyTitle}>No settlements yet</h3>
            <p className={styles.emptyDesc}>Settlements are created when a deal reaches the settling phase.</p>
          </div>
        ) : (
          <table className={styles.settTable}>
            <thead>
              <tr>
                <th>Room</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Payer</th>
                <th>Payee</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td>
                    <Link href={`/rooms/${s.room.id}`} className={styles.roomLink}>{s.room.title}</Link>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{s.room.type}</div>
                  </td>
                  <td><span className={styles.amount}>{s.amount}</span></td>
                  <td><span className={styles.paymentBadge}>{s.paymentType}</span></td>
                  <td>
                    <div className={styles.personCell}>
                      <div className={styles.personAvatar}>{s.payer.name?.charAt(0) || '?'}</div>
                      <span className={styles.personName}>{s.payer.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.personCell}>
                      <div className={styles.personAvatar}>{s.payee.name?.charAt(0) || '?'}</div>
                      <span className={styles.personName}>{s.payee.name}</span>
                    </div>
                  </td>
                  <td>{formatDate(s.dueDate)}</td>
                  <td><span className={`${styles.statusBadge} ${getStatusClass(s.status)}`}>{s.status}</span></td>
                  <td>
                    {s.status === 'Pending' && (
                      <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => handleStatusUpdate(s.id, 'Processing')}>
                        Process
                      </button>
                    )}
                    {s.status === 'Processing' && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className={`${styles.actionBtn} ${styles.actionBtnSuccess}`} onClick={() => handleStatusUpdate(s.id, 'Completed')}>
                          ✓ Complete
                        </button>
                        <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => handleStatusUpdate(s.id, 'Failed')}>
                          ✗ Fail
                        </button>
                      </div>
                    )}
                    {s.status === 'Completed' && s.paidAt && (
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Paid {formatDate(s.paidAt)}</span>
                    )}
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
