"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/i18n-context';

export default function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/marketplace?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <section className="hero-container" style={{
      position: 'relative',
      minHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      padding: '80px 20px',
      background: 'linear-gradient(135deg, #ffffff 0%, #f3f2f1 100%)',
      borderBottom: '1px solid var(--card-border)'
    }}>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="ms-badge" style={{ marginBottom: '24px' }}>Global Launch</div>
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 48px)',
          fontWeight: 600,
          marginBottom: '16px',
          maxWidth: '900px',
          lineHeight: 1.2,
          color: 'var(--foreground)'
        }}>
          {t('hero.title').split('<0>')[0]}
          <span style={{ color: 'var(--primary)' }}>
            {t('hero.title').split('<0>')[1].split('</0>')[0]}
          </span>
          {t('hero.title').split('</0>')[1]}
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 2vw, 18px)',
          color: 'var(--muted)',
          maxWidth: '800px',
          marginBottom: '48px',
          marginRight: 'auto',
          marginLeft: 'auto'
        }}>
          {t('hero.subtitle')}
        </p>

        {/* Search Bar - MS Style */}
        <form onSubmit={handleSearch} style={{
          width: '100%',
          maxWidth: '700px',
          margin: '0 auto 48px'
        }}>
          <div style={{
            display: 'flex',
            background: 'var(--card)',
            border: '1px solid #000',
            borderRadius: '0',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: '18px', paddingLeft: '16px' }}>🔍</span>
            <input
              type="text"
              placeholder={t('common.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            <button type="submit" className="btn-primary" style={{ height: '54px', padding: '0 40px' }}>
              {t('common.search')}
            </button>
          </div>
        </form>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
          <Link href="/marketplace">
            <button className="btn-primary" style={{ fontSize: '16px', padding: '12px 32px' }}>
              {t('hero.ctaPrimary')}
            </button>
          </Link>
          <Link href="/demand" className="ms-link" style={{ fontSize: '16px' }}>
            {t('hero.ctaSecondary')}
          </Link>
        </div>
      </div>
    </section>
  );
}
