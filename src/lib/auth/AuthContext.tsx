"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from './roles';

interface AuthContextType {
  user: User | null;
  setRole: (role: UserRole) => void;
  isLoading: boolean;
  login: (email: string, role?: UserRole) => void;
  logout: () => void;
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

  // Login Function (Mock)
  const login = (email: string, role: UserRole = 'Owner') => {
    // For demo/beta: we create a user object based on email
    // In real app, this would come from API
    let name = 'User';
    if (email.includes('seller')) name = 'Test Seller';
    if (email.includes('buyer')) name = 'Test Buyer';
    if (email.includes('admin')) name = 'Admin User';

    const newUser: User = {
      id: email.includes('admin') ? 'admin-uuid' : (email.includes('buyer') ? 'buyer-uuid' : MOCK_USER.id),
      name,
      email,
      role
    };
    setUser(newUser);
    localStorage.setItem('openip_user', JSON.stringify(newUser));
  };

  // Logout Function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('openip_user');
    localStorage.removeItem('demo_role');
  };

  useEffect(() => {
    // Check for persisted session in localStorage
    const saved = localStorage.getItem('openip_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse user session', e);
      }
    }
    // Note: We DO NOT auto-login to MOCK_USER anymore to allow "Login" flow testing.
    setIsLoading(false);
  }, []);

  const setRole = (role: UserRole) => {
    if (user) {
      const updated = { ...user, role };
      setUser(updated);
      localStorage.setItem('openip_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, setRole, isLoading, login, logout }}>
      {children}

      {/* Role Switcher Widget for Dev/Demo - Only show if logged in -- Disabled for Room Simulator
      {user && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(200,200,200,0.3)',
          padding: '12px',
          borderRadius: '12px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#666' }}>MODE SIMULATOR</div>
          <select
            value={user.role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            style={{
              background: 'white',
              color: 'black',
              border: '1px solid #ddd',
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
          <div style={{ fontSize: '10px', color: '#0078d4' }}>
            Active: {user.role}
          </div>
          <button onClick={logout} style={{
            fontSize: '10px',
            background: '#ffb900',
            border: 'none',
            padding: '4px',
            cursor: 'pointer',
            borderRadius: '4px'
          }}>
            Force Logout
          </button>
        </div>
      )} */}
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
