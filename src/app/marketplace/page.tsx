"use client";

import React, { useState, useEffect } from 'react';
import styles from '@/components/Marketplace/Marketplace.module.css';
import { IPListingCard, IPListing } from '@/components/Marketplace/IPListingCard';

import { useTranslation } from '@/components/I18nProvider';

export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [industry, setIndustry] = useState('All');
  const [listings, setListings] = useState<IPListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  const filters = ['All', 'Patent', 'Trademark', 'Software', 'Design'];
  const filterLabels: Record<string, string> = {
    'All': t('common.all'),
    'Patent': t('categories.patent'),
    'Trademark': t('categories.trademark'),
    'Software': t('categories.software'),
    'Design': t('categories.design')
  };
  const industries = ['All', 'AI', 'BioTech', 'Semiconductor', 'Batteries', 'Robotics', 'Available'];

  useEffect(() => {
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('q', search);
    if (activeFilter !== 'All') queryParams.append('ipType', activeFilter);
    if (industry !== 'All') queryParams.append('industry', industry);
    // Future: industry filter

    async function fetchListings() {
      setIsLoading(true); // Reset loading state on refetch
      try {
        const res = await fetch(`/api/ip_listings?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map((item: any) => ({
            id: item.id,
            title: item.title,
            summary: item.summary,
            ip_type: item.ipType,
            industry: item.industry,
            price_expectation: item.priceExpectation,
            visibility: item.visibility,
            status: item.status || 'Published',
            updated_at: item.updatedAt
          }));
          setListings(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch listings:', err);
      } finally {
        setIsLoading(false);
      }
    }

    // Debounce or just fetch on effect
    const timeoutId = setTimeout(() => fetchListings(), 300);
    return () => clearTimeout(timeoutId);
  }, [search, activeFilter, industry]);

  // Remove client-side filtering
  const filteredData = listings;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)', paddingTop: '100px', paddingBottom: '80px' }}>
      <div className="container">
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 600, marginBottom: '16px', color: 'var(--foreground)' }}>
            {t('marketplace.title').split('<0>')[0]}
            <span style={{ color: 'var(--primary)' }}>
              {t('marketplace.title').split('<0>')[1].split('</0>')[0]}
            </span>
            {t('marketplace.title').split('</0>')[1]}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
            {t('marketplace.subtitle')}
          </p>
        </div>

        {/* Search & Filters Section */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{
              display: 'flex',
              background: 'var(--card)',
              border: '1px solid #000',
              borderRadius: '0',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <span style={{ fontSize: '18px', paddingLeft: '16px' }}>🔍</span>
              <input
                type="text"
                placeholder={t('common.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--foreground)',
                  padding: '16px',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {filters.map(filter => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '2px',
                      border: activeFilter === filter ? '1px solid var(--primary)' : '1px solid var(--card-border)',
                      background: activeFilter === filter ? 'var(--primary)' : 'transparent',
                      color: activeFilter === filter ? 'white' : 'var(--foreground)',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    {filterLabels[filter] || filter}
                  </button>
                ))}
              </div>

              <select
                className="input-field"
                style={{ width: 'auto', padding: '6px 32px 6px 12px', height: 'auto', fontSize: '13px' }}
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              >
                {industries.map(ind => (
                  <option key={ind} value={ind}>{ind === 'All' ? t('marketplace.allIndustries') : ind}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '100px', color: 'var(--muted)' }}>
            {t('common.loading')}
          </div>
        ) : (
          <section style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '32px'
          }}>
            {filteredData.map(item => (
              <IPListingCard key={item.id} item={item} />
            ))}
            {filteredData.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', color: 'var(--muted)' }}>
                {t('common.noResults')}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
