"use client";

import HeroSection from '@/components/Home/HeroSection';
import StatsTicker from '@/components/Home/StatsTicker';
import CategoryGrid from '@/components/Home/CategoryGrid';
import FeaturedSection from '@/components/Home/FeaturedSection';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/i18n-context';

export default function Home() {
  const { t } = useTranslation();

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <HeroSection />
      <StatsTicker />

      {/* Short Featured IP & Demand Section */}
      <FeaturedSection />

      {/* Category Grid */}
      <section style={{ background: 'var(--surface)' }}>
        <CategoryGrid />
      </section>

      {/* Expert Highlight CTA */}
      <section className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
        <div className="fluent-card" style={{
          padding: '60px',
          background: 'var(--card)',
        }}>
          <h2 style={{ fontSize: '32px', marginBottom: '16px', fontWeight: 600 }}>Need Expert Guidance?</h2>
          <p style={{ color: 'var(--muted)', maxWidth: '600px', margin: '0 auto 32px', fontSize: '18px' }}>
            Connect with top-rated brokers and valuation experts to maximize your IP value.
            Trusted by enterprise partners worldwide.
          </p>
          <Link href="/experts">
            <button className="btn-primary" style={{ padding: '16px 48px', fontSize: '16px' }}>
              Find an Expert
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#1b1a19', // Dark Microsoft background for footer
        padding: '80px 0 40px',
        color: '#a19f9d',
        fontSize: '14px'
      }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '60px', textAlign: 'left' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '20px', color: '#ffffff', marginBottom: '20px' }}>
                OPEN<span style={{ color: 'var(--primary)' }}>IP</span>
              </div>
              <p style={{ lineHeight: '1.6' }}>{t('footer.description')}</p>
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '20px' }}>{t('footer.product')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Link href="/marketplace">{t('nav.marketplace')}</Link>
                <Link href="/demand">{t('nav.demand')}</Link>
                <Link href="/experts">{t('nav.experts')}</Link>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '20px' }}>{t('footer.legal')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Link href="/privacy">{t('footer.privacy')}</Link>
                <Link href="/terms">{t('footer.terms')}</Link>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #3b3a39', paddingTop: '40px', textAlign: 'center' }}>
            © {new Date().getFullYear()} OpenIP Market. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
