"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from './roles';

interface AuthContextType {
  user: User | null;
  setRole: (role: UserRole) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USER: User = {
  id: '6372eab1-5a32-4360-bda4-4c236ce03b55', // Test Seller ID from seed
  name: 'Test Seller',
  email: 'seller@test.com',
  role: 'Owner'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load
    const savedRole = localStorage.getItem('demo_role') as UserRole;
    setUser({ ...MOCK_USER, role: savedRole || 'Owner' });
    setIsLoading(false);
  }, []);

  const setRole = (role: UserRole) => {
    setUser(prev => prev ? { ...prev, role } : null);
    localStorage.setItem('demo_role', role);
  };

  return (
    <AuthContext.Provider value={{ user, setRole, isLoading }}>
      {children}
      {/* Role Switcher Widget for Dev/Demo */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--glass-border)',
        padding: '12px',
        borderRadius: '12px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
      }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>MODE SIMULATOR</div>
        <select
          value={user?.role || 'Owner'}
          onChange={(e) => setRole(e.target.value as UserRole)}
          style={{
            background: 'var(--card)',
            color: 'white',
            border: '1px solid var(--glass-border)',
            borderRadius: '6px',
            padding: '4px'
          }}
        >
          <option value="Owner">Owner (Seller)</option>
          <option value="Buyer">Buyer</option>
          <option value="Broker">Broker</option>
          <option value="Valuator">Valuator</option>
          <option value="Admin">Admin</option>
        </select>
        <div style={{ fontSize: '10px', color: 'var(--accent)' }}>
          Active: {user?.role}
        </div>
      </div>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
