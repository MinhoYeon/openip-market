"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/components/Demand/Demand.module.css';

const IP_TYPES = ['Patent', 'Trademark', 'Design', 'Software', 'Any'];
const URGENCY = ['Urgent', 'Normal', 'Flexible'];

import { useAuth } from '@/lib/auth/AuthContext';

export default function CreateDemandPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ipTypeNeeded, setIpTypeNeeded] = useState('Patent');
  const [industry, setIndustry] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [urgency, setUrgency] = useState('Normal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !user) {
      alert("Please login first");
      return;
    }
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/demand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          ipTypeNeeded,
          industry: industry || null,
          budgetRange: budgetRange || null,
          urgency,
          requesterId: user.id
        })
      });

      if (res.ok) {
        const created = await res.json();
        router.push(`/demand/${created.id}`);
      }
    } catch (err) {
      console.error('Failed to create demand:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', background: 'var(--surface)', paddingTop: '100px', paddingBottom: '80px' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="fluent-card" style={{ padding: '48px', background: 'var(--card)' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '8px', color: 'var(--foreground)' }}>
            Post a Buyer Demand
          </h1>
          <p style={{ color: 'var(--muted)', marginBottom: '40px' }}>
            Tell our network of experts and IP owners what technology or assets you are looking for.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>Title *</label>
              <input
                className="input-field"
                placeholder="e.g., Looking for AI-based diagnosis patent"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>Detailed Requirements</label>
              <textarea
                className="input-field"
                style={{ minHeight: '150px', resize: 'vertical' }}
                placeholder="Describe your technology requirements, use cases, preferred terms..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>IP Type Needed *</label>
                <select className="input-field" value={ipTypeNeeded} onChange={e => setIpTypeNeeded(e.target.value)}>
                  {IP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>Urgency</label>
                <select className="input-field" value={urgency} onChange={e => setUrgency(e.target.value)}>
                  {URGENCY.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>Industry</label>
                <input
                  className="input-field"
                  placeholder="e.g., Healthcare, Automotive"
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>Budget Range</label>
                <input
                  className="input-field"
                  placeholder="e.g., 100M-500M KRW"
                  value={budgetRange}
                  onChange={e => setBudgetRange(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', borderTop: '1px solid var(--card-border)', paddingTop: '32px' }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting || !title}
                style={{ padding: '12px 40px' }}
              >
                {isSubmitting ? 'Posting...' : 'Post Demand'}
              </button>
              <button
                type="button"
                className="ms-link"
                onClick={() => router.push('/demand')}
                style={{ fontSize: '16px' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
