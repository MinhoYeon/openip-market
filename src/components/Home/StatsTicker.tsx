export default function StatsTicker() {
  const stats = [
    { label: "IP Listings", value: "1,200+" },
    { label: "Deals Closed", value: "500+" },
    { label: "Total Value", value: "$250M+" },
    { label: "Active Buyers", value: "800+" },
    { label: "Expert Brokers", value: "150+" }
  ];

  return (
    <section style={{
      borderTop: '1px solid var(--glass-border)',
      borderBottom: '1px solid var(--glass-border)',
      background: 'rgba(0,0,0,0.2)',
      padding: '24px 0',
      overflow: 'hidden'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: '32px'
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div className="gradient-text" style={{ fontSize: '32px', fontWeight: 800, marginBottom: '4px' }}>{s.value}</div>
            <div style={{ color: 'var(--muted)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
