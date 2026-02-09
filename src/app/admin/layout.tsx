"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RoleGuard } from '@/components/Auth/RoleGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: '📊' },
    { label: 'Fee Policies', href: '/admin/fees', icon: '💰' },
    { label: 'Users', href: '/admin/users', icon: '👥' },
    { label: 'Platform Settings', href: '/admin/settings', icon: '⚙️' },
  ];

  return (
    <RoleGuard allowedRoles={['Admin']} pessimistic>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a' }}>
        {/* Sidebar */}
        <aside style={{
          width: '260px',
          background: '#111',
          borderRight: '1px solid #333',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: 800,
            marginBottom: '40px',
            color: 'var(--accent)',
            letterSpacing: '-0.5px'
          }}>
            OPENIP <span style={{ color: '#fff' }}>ADMIN</span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {navItems.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: isActive ? '#fff' : '#888',
                    background: isActive ? 'var(--primary)' : 'transparent',
                    fontWeight: isActive ? 600 : 400,
                    transition: 'all 0.2s'
                  }}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid #333' }}>
            <Link href="/" style={{ color: '#666', textDecoration: 'none', fontSize: '14px' }}>
              ← Return to Site
            </Link>
          </div>
        </aside>

        {/* Audit Log / Main Content Wrapper */}
        <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}
