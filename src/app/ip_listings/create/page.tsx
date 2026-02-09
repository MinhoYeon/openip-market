import IPListingWizard from '@/components/IPListingWizard/IPListingWizard';
import React from 'react';

export default function CreateIPListingPage() {
  return (
    <main style={{ minHeight: '100vh', padding: '100px 0' }}>
      <div className="container">
        <h1 style={{ marginBottom: '8px', textAlign: 'center' }}>List Your Innovation</h1>
        <p style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: '40px' }}>
          Follow the steps below to prepare your IP for the marketplace.
        </p>

        <IPListingWizard />
      </div>
    </main>
  );
}
