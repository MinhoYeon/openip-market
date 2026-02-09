"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function FeaturedSection() {
  const [listings, setListings] = useState<any[]>([]);
  const [demands, setDemands] = useState<any[]>([]);

  useEffect(() => {
    // Fetch random Listings
    fetch('/api/ip_listings').then(res => res.json()).then(data => {
      if (Array.isArray(data)) setListings(data.slice(0, 3));
    }).catch(console.error);
    // Fetch random Demands
    fetch('/api/demand').then(res => res.json()).then(data => {
      if (Array.isArray(data)) setDemands(data.slice(0, 3));
    }).catch(console.error);
  }, []);

  return (
    <section className="container" style={{ padding: '80px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '48px' }}>

        {/* Listings Column */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600 }}>Trending Listings</h2>
            <Link href="/marketplace" className="ms-link">View All</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {listings.map((l, idx) => (
              <Link key={l.id} href={`/marketplace/${l.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="fluent-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    {idx === 0 && <span className="ms-badge">New</span>}
                    <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{l.ipType}</div>
                    <div style={{ fontWeight: 600, fontSize: '18px', marginBottom: '4px', color: 'var(--foreground)' }}>{l.title}</div>
                    <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '12px' }}>{l.priceExpectation || 'Negotiable'}</div>
                    <span className="ms-link" style={{ fontSize: '12px' }}>Learn more</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Demands Column */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600 }}>Buyer Demands</h2>
            <Link href="/demand" className="ms-link">View All</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {demands.map(d => (
              <Link key={d.id} href={`/demand/${d.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="fluent-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', borderLeft: '4px solid var(--primary)' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Buying Request</div>
                    <div style={{ fontWeight: 600, fontSize: '18px', marginBottom: '4px' }}>{d.title}</div>
                    <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '12px' }}>Budget: {d.budgetRange || 'Flexible'}</div>
                    <span className="ms-link" style={{ fontSize: '12px' }}>See details</span>
                  </div>
                  <div style={{ fontSize: '11px', border: '1px solid #ccc', color: 'var(--foreground)', padding: '2px 8px', borderRadius: '0', height: 'fit-content', fontWeight: 600 }}>
                    {d.urgency}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
