import Link from 'next/link';
import { useTranslation } from '@/components/I18nProvider';

export default function CategoryGrid() {
  const { t } = useTranslation();

  const categories = [
    { name: t('categories.patent'), icon: '📜', desc: t('categories.patentDesc'), key: 'Patent' },
    { name: t('categories.trademark'), icon: '©️', desc: t('categories.trademarkDesc'), key: 'Trademark' },
    { name: t('categories.design'), icon: '🎨', desc: t('categories.designDesc'), key: 'Design' },
    { name: t('categories.software'), icon: '💻', desc: t('categories.softwareDesc'), key: 'Software' },
    { name: 'Biotech', icon: '🧬', desc: 'Pharma & Life Sciences.', key: 'Biotech' },
    { name: 'Semiconductor', icon: '💾', desc: 'Chips & Electronics.', key: 'Semiconductor' }
  ];

  return (
    <section className="container" style={{ padding: '80px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h2 style={{ fontSize: '32px', marginBottom: '16px', fontWeight: 700 }}>{t('categories.title')}</h2>
        <p style={{ color: 'var(--muted)', maxWidth: '600px', margin: '0 auto' }}>
          Find the intellectual property that fits your business needs. Comprehensive enterprise solutions.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '24px'
      }}>
        {categories.map((c, i) => (
          <Link href={`/marketplace?ipType=${c.key}`} key={i} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="fluent-card" style={{
              padding: '40px',
              textAlign: 'center',
              cursor: 'pointer',
              height: '100%',
              display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '24px' }}>{c.icon}</div>
              <h3 style={{ marginBottom: '12px', fontSize: '20px', fontWeight: 600 }}>{c.name}</h3>
              <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.5' }}>{c.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
