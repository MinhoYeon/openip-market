"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTranslation } from '@/components/I18nProvider';
import { RoleGuard } from '@/components/Auth/RoleGuard';

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  // Hide on Admin pages
  if (pathname?.startsWith('/admin')) return null;

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

  const { t } = useTranslation();

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
        {user ? (
          <>
            <div style={{ position: 'relative' }}>
              <button
                className="btn-secondary"
                style={{ fontSize: '20px', padding: '8px', position: 'relative' }}
                onClick={() => setShowDropdown(!showDropdown)}
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '2px', right: '2px',
                    background: 'var(--danger)', color: 'white',
                    borderRadius: '50%', width: '16px', height: '16px',
                    fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {showDropdown && (
                <div className="fluent-card" style={{
                  position: 'absolute', top: '48px', right: 0, width: '320px',
                  maxHeight: '400px', overflowY: 'auto', padding: '0',
                  background: 'var(--card)',
                  zIndex: 1001,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>{t('common.notifications') || 'Notifications'}</span>
                    <button onClick={() => markRead()} className="ms-link" style={{ fontSize: '12px' }}>{t('common.markAllRead') || 'Mark all read'}</button>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)' }}>{t('common.noNotifications') || 'No notifications'}</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => markRead([n.id])}
                        style={{
                          padding: '16px',
                          borderBottom: '1px solid var(--card-border)',
                          background: n.isRead ? 'transparent' : 'var(--surface)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                          {n.type} • {new Date(n.createdAt).toLocaleDateString()}
                        </div>
                        <Link href={n.link || '#'} style={{ display: 'block', fontSize: '14px', color: 'var(--foreground)', textDecoration: 'none' }}>
                          {n.content}
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
