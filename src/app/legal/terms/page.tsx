export default function TermsPage() {
  return (
    <div className="container" style={{ padding: '120px 20px', maxWidth: '800px' }}>
      <h1>Terms of Service</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '40px' }}>Last updated: February 2026</p>

      <div className="fluent-card" style={{ padding: '40px' }}>
        <h3>1. Introduction</h3>
        <p>Welcome to OpenIP Market. By accessing our platform, you agree to these terms...</p>

        <h3>2. User Accounts</h3>
        <p>You are responsible for maintaining the security of your account...</p>

        <h3>3. IP Transactions</h3>
        <p>OpenIP Market acts as a facilitator for IP transactions...</p>

        {/* Placeholder for actual legal text */}
        <p style={{ marginTop: '40px', fontStyle: 'italic', color: 'var(--muted)' }}>
          [This is a placeholder. Please replace with actual Terms of Service.]
        </p>
      </div>
    </div>
  );
}
