export default function PrivacyPage() {
  return (
    <div className="container" style={{ padding: '120px 20px', maxWidth: '800px' }}>
      <h1>Privacy Policy</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '40px' }}>Last updated: February 2026</p>

      <div className="fluent-card" style={{ padding: '40px' }}>
        <h3>1. Data Collection</h3>
        <p>We collect information you provide directly to us...</p>

        <h3>2. Use of Information</h3>
        <p>We use the information to provide, maintain, and improve our services...</p>

        <h3>3. Data Sharing</h3>
        <p>We do not share your personal information with third parties except...</p>

        {/* Placeholder for actual legal text */}
        <p style={{ marginTop: '40px', fontStyle: 'italic', color: 'var(--muted)' }}>
          [This is a placeholder. Please replace with actual Privacy Policy.]
        </p>
      </div>
    </div>
  );
}
