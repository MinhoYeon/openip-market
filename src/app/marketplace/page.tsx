"use client";

import React, { useState, useEffect, Suspense } from 'react';
import styles from '@/components/Marketplace/Marketplace.module.css';
import { IPListingCard, IPListing } from '@/components/Marketplace/IPListingCard';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTranslation } from '@/lib/i18n/i18n-context';

function MarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Initialize from URL query param
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [activeFilter, setActiveFilter] = useState('All');
  const [industry, setIndustry] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');

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
    if (minPrice) queryParams.append('minPrice', minPrice);
    if (maxPrice) queryParams.append('maxPrice', maxPrice);
    if (sort) queryParams.append('sort', sort);

    async function fetchListings() {
      setIsLoading(true);
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

    const timeoutId = setTimeout(() => fetchListings(), 300);
    return () => clearTimeout(timeoutId);
  }, [search, activeFilter, industry, minPrice, maxPrice, sort]);

  const filteredData = listings;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)', paddingTop: '100px', paddingBottom: '80px' }}>
      <div className="container flex gap-8">
        {/* Sidebar Filters */}
        <aside className="w-64 hidden md:block shrink-0">
          <div className="bg-white p-6 rounded-lg border border-slate-200 sticky top-24">
            <h3 className="font-bold text-lg mb-4">Filters</h3>

            {/* IP Type */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-slate-500 mb-2 block">IP Type</label>
              <div className="flex flex-col gap-2">
                {filters.map(filter => (
                  <label key={filter} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="ipType"
                      checked={activeFilter === filter}
                      onChange={() => setActiveFilter(filter)}
                      className="accent-blue-600"
                    />
                    {filterLabels[filter] || filter}
                  </label>
                ))}
              </div>
            </div>

            {/* Industry */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-slate-500 mb-2 block">Industry</label>
              <select
                className="input-field w-full text-sm"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              >
                {industries.map(ind => (
                  <option key={ind} value={ind}>{ind === 'All' ? t('marketplace.allIndustries') : ind}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="text-sm font-semibold text-slate-500 mb-2 block">Price Range (KRW)</label>
              <div className="flex flex-col gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  className="input-field text-sm"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="input-field text-sm"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header & Search */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold">
                Marketplace <span className="text-blue-600">IP Listings</span>
              </h1>
              <p className="text-slate-500">{t('marketplace.subtitle')}</p>
            </div>
            {user && user.role === 'Owner' && (
              <button
                className="btn-primary"
                onClick={() => router.push('/ip_listings/create')}
              >
                List Your IP
              </button>
            )}
          </div>

          {/* Search Bar & Sort */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input
                type="text"
                placeholder={t('common.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              className="input-field w-full md:w-auto"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          {/* Listings Grid */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '100px', color: 'var(--muted)' }}>
              {t('common.loading')}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              {filteredData.map(item => (
                <IPListingCard key={item.id} item={item} />
              ))}
              {filteredData.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', color: 'var(--muted)' }}>
                  {t('common.noResults')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MarketplaceContent />
    </Suspense>
  );
}
