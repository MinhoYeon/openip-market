"use client";

import React from 'react';
import Link from 'next/link';
import styles from './Marketplace.module.css';

export interface IPListing {
  id: string;
  title: string;
  summary: string;
  ip_type: string;
  industry: string;
  price_expectation: string;
  visibility: string;
  status: string;
  updated_at: string;
}

interface CardProps {
  item: IPListing;
}

export const IPListingCard: React.FC<CardProps> = ({ item }) => {
  return (
    <Link href={`/marketplace/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="fluent-card" style={{ padding: '24px', cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
          <span className="ms-badge" style={{ margin: 0 }}>{item.ip_type}</span>
          <span style={{ fontSize: '12px', color: item.status === 'Published' ? 'var(--success)' : 'var(--muted)', fontWeight: 600 }}>
            {item.status === 'Published' ? '● Available' : item.status || 'Available'}
          </span>
        </div>

        <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: 'var(--foreground)' }}>{item.title}</h3>
        <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '20px', flex: 1, lineHeight: '1.5' }}>{item.summary}</p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', background: 'var(--surface)', padding: '4px 8px', color: 'var(--foreground)' }}>{item.industry}</span>
          <span style={{ fontSize: '12px', background: 'var(--surface)', padding: '4px 8px', color: 'var(--foreground)' }}>{item.visibility === 'Full' ? 'Public' : 'NDA Required'}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
          <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--primary)' }}>
            {item.price_expectation || 'Negotiable'}
          </div>
          <span className="ms-link" style={{ fontSize: '14px' }}>
            View Details
          </span>
        </div>
      </div>
    </Link>
  );
};
