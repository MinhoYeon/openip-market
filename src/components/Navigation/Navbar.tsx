"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTranslation } from '@/lib/i18n/i18n-context';
import { RoleGuard } from '@/components/Auth/RoleGuard';
import NotificationBell from '@/components/Notification/NotificationBell';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  // Hide on Admin pages


  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  async function fetchNotifications() {
    if (!user) return;
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.isRead).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  }

  async function markRead(ids?: string[]) {
    if (!user) return;
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, notificationIds: ids }) // undefined = all
      });
      fetchNotifications();
    } catch (e) { console.error(e); }
  }

  const { t, locale, setLocale } = useTranslation();

  // Hide on Admin pages
  if (pathname?.startsWith('/admin')) return null;

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid #e1e1e1',
      padding: '0 40px',
      height: '60px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
        <Link href="/" style={{ fontSize: '20px', fontWeight: 800, textDecoration: 'none', color: '#000' }}>
          OPEN<span style={{ color: 'var(--primary)' }}>IP</span>
        </Link>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[
            { label: t('nav.marketplace'), href: '/marketplace' },
            { label: t('nav.demand'), href: '/demand' },
            { label: t('nav.rooms'), href: '/rooms' },
            { label: t('nav.experts'), href: '/experts' },
            { label: t('nav.documents'), href: '/documents' },
            { label: t('nav.mandates'), href: '/mandates' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                color: '#616161',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = '#000')}
              onMouseOut={(e) => (e.currentTarget.style.color = '#616161')}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Language Toggle */}
        <div style={{ display: 'flex', gap: '4px', border: '1px solid #e1e1e1', borderRadius: '4px', padding: '2px' }}>
          <button
            onClick={() => setLocale('ko')}
            style={{
              padding: '4px 8px',
              borderRadius: '2px',
              border: 'none',
              background: locale === 'ko' ? 'var(--primary)' : 'transparent',
              color: locale === 'ko' ? 'white' : 'var(--muted)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            KO
          </button>
          <button
            onClick={() => setLocale('en')}
            style={{
              padding: '4px 8px',
              borderRadius: '2px',
              border: 'none',
              background: locale === 'en' ? 'var(--primary)' : 'transparent',
              color: locale === 'en' ? 'white' : 'var(--muted)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            EN
          </button>
        </div>

        {user ? (
          <>
            <div style={{ position: 'relative' }}>
              <NotificationBell />
            </div>

            <div style={{ position: 'relative' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div style={{
                  width: '32px', height: '32px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 600
                }}>
                  {user.name?.[0] || 'U'}
                </div>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--foreground)' }}>{user.name}</span>
              </div>

              {/* User Dropdown */}
              {showDropdown && (
                <div className="fluent-card" style={{
                  position: 'absolute', top: '48px', right: 0, width: '200px',
                  background: 'var(--card)', zIndex: 1002, padding: '8px'
                }}>
                  <div style={{ padding: '8px', borderBottom: '1px solid var(--card-border)', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 600 }}>{user.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{user.email}</div>
                  </div>
                  <Link
                    href="/demand?filter=mine"
                    onClick={() => setShowDropdown(false)}
                    style={{
                      display: 'block', padding: '8px', color: 'var(--foreground)',
                      textDecoration: 'none', fontSize: '14px', fontWeight: 500
                    }}
                  >
                    📂 My Requests
                  </Link>
                  <Link
                    href="/valuation/my-requests"
                    onClick={() => setShowDropdown(false)}
                    style={{
                      display: 'block', padding: '8px', color: 'var(--foreground)',
                      textDecoration: 'none', fontSize: '14px', fontWeight: 500
                    }}
                  >
                    ⚖️ My Valuations
                  </Link>
                  {user.role === 'Admin' && (
                    <Link
                      href="/admin"
                      onClick={() => setShowDropdown(false)}
                      style={{
                        display: 'block', padding: '8px', color: 'var(--primary)',
                        textDecoration: 'none', fontSize: '14px', fontWeight: 600
                      }}
                    >
                      🛡️ Admin Dashboard
                    </Link>
                  )}
                  <button onClick={() => { logout(); setShowDropdown(false); }}
                    style={{ width: '100%', textAlign: 'left', padding: '8px', color: 'var(--danger)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link href="/login" className="btn-primary" style={{ padding: '8px 24px', textDecoration: 'none' }}>
            {t('common.login')}
          </Link>
        )}
      </div>
    </nav>
  );
}
