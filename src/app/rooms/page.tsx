"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/components/Room/Room.module.css';

interface RoomSummary {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  ipListing: { id: string; title: string; ipType: string };
  participants: { user: { id: string; name: string; role: string }; role: string }[];
  _count: { offers: number; documents: number };
}

const TYPE_TABS = [
  { id: 'all', label: 'All Rooms' },
  { id: 'Deal', label: 'Deals' },
  { id: 'License', label: 'Licenses' },
  { id: 'Valuation', label: 'Valuations' },
];

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeType, setActiveType] = useState('all');

  useEffect(() => {
    async function fetchRooms() {
      try {
        const res = await fetch('/api/rooms');
        if (res.ok) setRooms(await res.json());
      } catch (err) {
        console.error('Failed to fetch rooms:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRooms();
  }, []);

  const filtered = activeType === 'all'
    ? rooms
    : rooms.filter(r => r.type === activeType);

  const getTypeClass = (type: string) => {
    if (type === 'Deal') return styles.typeDeal;
    if (type === 'License') return styles.typeLicense;
    return styles.typeValuation;
  };

  const getStatusClass = (status: string) => {
    const map: Record<string, string> = {
      Setup: styles.statusSetup,
      Negotiating: styles.statusNegotiating,
      Signing: styles.statusSigning,
      Settling: styles.statusSettling,
      Completed: styles.statusCompleted,
      Terminated: styles.statusTerminated,
    };
    return map[status] || styles.statusSetup;
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });

  const typeCounts = rooms.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <main className={styles.roomsContainer}>
      <div className="container">
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>
            Deal <span className="gradient-text">Rooms</span>
          </h1>
        </div>

        {/* Type Tabs */}
        <div className={styles.typeTabs}>
          {TYPE_TABS.map(tab => (
            <button
              key={tab.id}
              className={`${styles.typeTab} ${activeType === tab.id ? styles.typeTabActive : ''}`}
              onClick={() => setActiveType(tab.id)}
            >
              {tab.label}
              {tab.id === 'all'
                ? <span className={styles.tabCount}>{rooms.length}</span>
                : typeCounts[tab.id] > 0 && <span className={styles.tabCount}>{typeCounts[tab.id]}</span>
              }
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className={styles.spinner} />
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🏠</div>
            <h3 className={styles.emptyTitle}>No rooms yet</h3>
            <p className={styles.emptyDesc}>
              Rooms are created when you submit an offer on an IP listing.
            </p>
          </div>
        ) : (
          <div className={styles.roomGrid}>
            {filtered.map(room => (
              <Link key={room.id} href={`/rooms/${room.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className={`glass-card ${styles.roomCard}`}>
                  <div className={styles.roomCardHeader}>
                    <span className={`${styles.roomType} ${getTypeClass(room.type)}`}>{room.type}</span>
                    <span className={`${styles.roomStatus} ${getStatusClass(room.status)}`}>{room.status}</span>
                  </div>
                  <h3 className={styles.roomTitle}>{room.title}</h3>
                  <p className={styles.roomIP}>📋 {room.ipListing.title}</p>
                  <div className={styles.roomMeta}>
                    <div className={styles.roomMetaItem}>
                      <span className={styles.metaLabel}>Participants</span>
                      <span className={styles.metaValue}>{room.participants.length}</span>
                    </div>
                    <div className={styles.roomMetaItem}>
                      <span className={styles.metaLabel}>Offers</span>
                      <span className={styles.metaValue}>{room._count.offers}</span>
                    </div>
                    <div className={styles.roomMetaItem}>
                      <span className={styles.metaLabel}>Documents</span>
                      <span className={styles.metaValue}>{room._count.documents}</span>
                    </div>
                    <div className={styles.roomMetaItem}>
                      <span className={styles.metaLabel}>Updated</span>
                      <span className={styles.metaValue}>{formatDate(room.updatedAt)}</span>
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
