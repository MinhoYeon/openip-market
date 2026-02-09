"use client";

import React, { useState } from 'react';
import styles from './Wizard.module.css';

interface StepProps {
  data: any;
  updateData: (fields: any) => void;
  onNext: (direction?: number) => void;
}

const Step1BasicInfo: React.FC<StepProps> = ({ data, updateData, onNext }) => {
  return (
    <div className="glass-card" style={{ padding: '40px' }}>
      <h2 style={{ marginBottom: '24px' }}>Basic IP Information</h2>

      <div className={styles.inputGroup}>
        <label className={styles.label}>Title of Innovation</label>
        <input
          type="text"
          className={styles.input}
          placeholder="e.g., Low-power wireless charging structure"
          value={data.title || ''}
          onChange={(e) => updateData({ title: e.target.value })}
        />
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>IP Category</label>
        <select
          className={styles.select}
          value={data.ip_type || ''}
          onChange={(e) => updateData({ ip_type: e.target.value })}
        >
          <option value="">Select Category</option>
          <option value="Patent">Patent</option>
          <option value="Trademark">Trademark</option>
          <option value="Design">Design</option>
          <option value="Software">Software/Copyright</option>
        </select>
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>Executive Summary</label>
        <textarea
          className={styles.textarea}
          placeholder="Briefly describe the core value and technical problem solved..."
          value={data.summary || ''}
          onChange={(e) => updateData({ summary: e.target.value })}
        />
      </div>

      <div className={styles.actions}>
        <button className="btn-primary" onClick={() => onNext(1)} disabled={!data.title || !data.ip_type}>
          Continue to Step 2
        </button>
      </div>
    </div>
  );
};

const Step2RightsHolders: React.FC<StepProps> = ({ data, updateData, onNext }) => {
  const holders = data.right_holders || [{ name: '', share_percent: 100 }];

  const addHolder = () => {
    updateData({ right_holders: [...holders, { name: '', share_percent: 0 }] });
  };

  const updateHolder = (index: number, fields: any) => {
    const newHolders = [...holders];
    newHolders[index] = { ...newHolders[index], ...fields };
    updateData({ right_holders: newHolders });
  };

  const removeHolder = (index: number) => {
    const newHolders = holders.filter((_: any, i: number) => i !== index);
    updateData({ right_holders: newHolders });
  };

  const totalShare = holders.reduce((sum: number, h: any) => sum + (Number(h.share_percent) || 0), 0);
  const isValid = totalShare === 100 && holders.every((h: any) => h.name.trim() !== '');

  return (
    <div className="glass-card" style={{ padding: '40px' }}>
      <h2 style={{ marginBottom: '8px' }}>Rights Holders</h2>
      <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>List all entities owning a share of this intellectual property.</p>

      {holders.map((holder: any, index: number) => (
        <div key={index} style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '16px',
          alignItems: 'flex-end',
          padding: '16px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '12px',
          border: '1px solid var(--glass-border)'
        }}>
          <div style={{ flex: 2 }}>
            <label className={styles.label}>Holder Name / Organization</label>
            <input
              type="text"
              className={styles.input}
              value={holder.name}
              onChange={(e) => updateHolder(index, { name: e.target.value })}
              placeholder="e.g., John Doe or ABC Corp"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className={styles.label}>Share (%)</label>
            <input
              type="number"
              className={styles.input}
              value={holder.share_percent}
              onChange={(e) => updateHolder(index, { share_percent: e.target.value })}
            />
          </div>
          {holders.length > 1 && (
            <button
              onClick={() => removeHolder(index)}
              style={{ color: 'var(--danger)', paddingBottom: '12px', fontSize: '20px' }}
            >
              &times;
            </button>
          )}
        </div>
      ))}

      <button
        onClick={addHolder}
        style={{ color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <span>+</span> Add Another Holder
      </button>

      <div style={{
        marginTop: '32px',
        padding: '16px',
        borderRadius: '12px',
        background: totalShare === 100 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontWeight: 500 }}>Total Share Ownership:</span>
        <span style={{
          fontSize: '20px',
          fontWeight: 700,
          color: totalShare === 100 ? 'var(--success)' : 'var(--danger)'
        }}>{totalShare}%</span>
      </div>

      <div className={styles.actions}>
        <button className="glass-card" onClick={() => onNext(-1)} style={{ padding: '12px 24px' }}>Back</button>
        <button className="btn-primary" onClick={() => onNext(1)} disabled={!isValid}>
          Continue to Step 3
        </button>
      </div>
    </div>
  );
};

const Step3Technology: React.FC<StepProps> = ({ data, updateData, onNext }) => {
  return (
    <div className="glass-card" style={{ padding: '40px' }}>
      <h2 style={{ marginBottom: '8px' }}>Technology Classification</h2>
      <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>Categorize your IP to help buyers find it.</p>

      <div className={styles.inputGroup}>
        <label className={styles.label}>IPC/CPC Code (International Patent Classification)</label>
        <input
          type="text"
          className={styles.input}
          placeholder="e.g., H02J 50/10"
          value={data.ipc || ''}
          onChange={(e) => updateData({ ipc: e.target.value })}
        />
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>Industry Sector</label>
        <select
          className={styles.select}
          value={data.industry || ''}
          onChange={(e) => updateData({ industry: e.target.value })}
        >
          <option value="">Select Industry</option>
          <option value="Electronic">Electronics & ICT</option>
          <option value="Bio">Biotechnology / Healthcare</option>
          <option value="Mobility">Mobility & Automotive</option>
          <option value="Energy">Energy & Environment</option>
          <option value="Materials">New Materials / Nanotech</option>
        </select>
      </div>

      <div className={styles.actions}>
        <button className="glass-card" onClick={() => onNext(-1)} style={{ padding: '12px 24px' }}>Back</button>
        <button className="btn-primary" onClick={() => onNext(1)} disabled={!data.ipc || !data.industry}>
          Continue to Finals
        </button>
      </div>
    </div>
  );
};

const Step4Closing: React.FC<StepProps> = ({ data, updateData, onNext }) => {
  return (
    <div className="glass-card" style={{ padding: '40px' }}>
      <h2 style={{ marginBottom: '8px' }}>Set Visibility & Intent</h2>
      <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>How should this IP be listed in the marketplace?</p>

      <div className={styles.inputGroup}>
        <label className={styles.label}>Listing Visibility</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { id: 'Full', label: 'Public Display', desc: 'Visible to all portal users' },
            { id: 'Teaser', label: 'Teaser Only', desc: 'Title/Summary only until NDA' }
          ].map(opt => (
            <div
              key={opt.id}
              className="glass-card"
              onClick={() => updateData({ visibility: opt.id })}
              style={{
                padding: '20px',
                cursor: 'pointer',
                borderColor: data.visibility === opt.id ? 'var(--primary)' : 'var(--glass-border)',
                background: data.visibility === opt.id ? 'var(--primary-glow)' : 'transparent'
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>{opt.label}</div>
              <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{opt.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>Transaction Expectation (Optional)</label>
        <input
          type="text"
          className={styles.input}
          placeholder="Price range or model (e.g., 50M-100M KRW)"
          value={data.price_expectation || ''}
          onChange={(e) => updateData({ price_expectation: e.target.value })}
        />
      </div>

      <div className={styles.actions}>
        <button className="glass-card" onClick={() => onNext(-1)} style={{ padding: '12px 24px' }}>Back</button>
        <button
          className="btn-primary"
          onClick={async () => {
            try {
              const res = await fetch('/api/ip_listings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });
              if (res.ok) {
                alert('Proposal Submitted successfully to the real database!');
                window.location.href = '/marketplace';
              } else {
                const error = await res.json();
                alert('Submission failed: ' + (error.details || error.error));
              }
            } catch (err) {
              alert('Error connecting to API. Ensure database is running.');
            }
          }}
          style={{ background: 'var(--success)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)' }}
        >
          Submit to Marketplace
        </button>
      </div>
    </div>
  );
};

export default function IPListingWizard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    right_holders: [{ name: '', share_percent: 100 }],
    visibility: 'Full'
  });

  const updateData = (fields: any) => {
    setFormData(prev => ({ ...prev, ...fields }));
  };

  const handleNavigate = (direction?: number) => {
    if (direction) setStep(prev => prev + direction);
  };

  return (
    <div className={styles.wizardContainer}>
      <div className={styles.stepIndicator}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`${styles.stepCircle} ${step >= i ? styles.stepCircleActive : ''}`}>
            {i}
          </div>
        ))}
      </div>

      {step === 1 && <Step1BasicInfo data={formData} updateData={updateData} onNext={handleNavigate} />}
      {step === 2 && <Step2RightsHolders data={formData} updateData={updateData} onNext={handleNavigate} />}
      {step === 3 && <Step3Technology data={formData} updateData={updateData} onNext={handleNavigate} />}
      {step === 4 && <Step4Closing data={formData} updateData={updateData} onNext={handleNavigate} />}
    </div>
  );
}
