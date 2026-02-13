"use client";

import React, { useEffect, useState } from 'react';

interface AdminStats {
  users: number;
  rooms: number;
  listings: number;
  revenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          setStats(await res.json());
        }
      } catch (error) {
        console.error('Stats fetch error:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const Card = ({ title, value, icon, sub }: { title: string, value: string | number, icon: string, sub?: string }) => (
    <div className="fluent-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', background: 'white', border: '1px solid #edebe9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <span style={{ fontSize: '14px', color: '#605e5c', fontWeight: 600 }}>{title.toUpperCase()}</span>
        <span style={{ fontSize: '24px' }}>{icon}</span>
      </div>
      <div style={{ fontSize: '32px', fontWeight: 800, marginBottom: '4px', color: '#201f1e' }}>
        {loading ? '-' : value}
      </div>
      {sub && <div style={{ fontSize: '12px', color: '#107c10' }}>{sub}</div>}
    </div>
  );

  return (
    <div>
      <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Platform Overview</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>Welcome back, Admin.</p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        <Card title="Total Users" value={stats?.users || 0} icon="👥" sub="+12% from last month" />
        <Card title="Active Rooms" value={stats?.rooms || 0} icon="🏠" sub="4 pending action" />
        <Card title="IP Listings" value={stats?.listings || 0} icon="📋" sub="8 new this week" />
        <Card
          title="Total Revenue"
          value={`₩${stats?.revenue.toLocaleString() || 0}`}
          icon="💰"
          sub="Platform fees + Commissions"
        />
      </div>

      <div className="fluent-card" style={{ padding: '32px', textAlign: 'center', color: '#605e5c', background: 'white', border: '1px solid #edebe9' }}>
        <h3>Activity Graph Placeholder</h3>
        <p>Chart.js or Recharts integration usually goes here.</p>
      </div>
    </div>
  );
}
