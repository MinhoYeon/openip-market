"use client";

import React from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole } from '@/lib/auth/roles';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  pessimistic?: boolean; // If true, shows a "Locked" message instead of nothing
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  pessimistic = false
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  const roles = allowedRoles || [];
  const hasAccess = user && (roles.length === 0 || roles.includes(user.role) || user.role === 'Admin');

  if (!hasAccess) {
    if (pessimistic) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: 'rgba(239, 68, 68, 0.05)',
          border: '1px dashed var(--danger)',
          borderRadius: '16px',
          color: 'var(--muted)'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔒</div>
          <h3 style={{ color: 'var(--foreground)' }}>Access Restricted</h3>
          <p>Your current role ({user?.role}) does not have permission to access this feature.</p>
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
};
