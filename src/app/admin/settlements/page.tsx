
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { RoleGuard } from '@/components/Auth/RoleGuard';

interface Settlement {
  id: string;
  payer: { name: string; email: string };
  payee: { name: string; email: string };
  amount: string;
  status: string; // Pending, Completed
  createdAt: string;
  note?: string;
}

export default function AdminSettlementsPage() {
  const { user } = useAuth();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSettlements();
  }, [statusFilter]);

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/settlements?status=${statusFilter}`);
      if (res.ok) {
        setSettlements(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (id: string) => {
    if (!confirm('Are you sure you want to mark this settlement as PAID? This cannot be undone.')) return;

    setProcessingId(id);
    try {
      const res = await fetch('/api/admin/settlements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'Completed', note: 'Manually marked as paid by Admin' })
      });

      if (res.ok) {
        alert('Settlement marked as Completed.');
        fetchSettlements(); // refresh
      } else {
        alert('Failed to update status.');
      }
    } catch (e) {
      console.error(e);
      alert('Error processing request.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <RoleGuard allowedRoles={['Admin']}>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Settlement Management 💰</h1>
          <div className="flex gap-2">
            <select
              className="input-field"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
            <button onClick={fetchSettlements} className="btn-secondary">Refresh</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center p-8">Loading...</div>
        ) : (
          <div className="fluent-card bg-white overflow-hidden p-0">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-4 font-semibold text-sm text-slate-500">Date</th>
                  <th className="p-4 font-semibold text-sm text-slate-500">Payer (Buyer)</th>
                  <th className="p-4 font-semibold text-sm text-slate-500">Payee (Expert/Seller)</th>
                  <th className="p-4 font-semibold text-sm text-slate-500">Amount</th>
                  <th className="p-4 font-semibold text-sm text-slate-500">Status</th>
                  <th className="p-4 font-semibold text-sm text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {settlements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">No settlements found.</td>
                  </tr>
                ) : (
                  settlements.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-4 text-sm">{new Date(s.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className="font-medium">{s.payer.name}</div>
                        <div className="text-xs text-slate-500">{s.payer.email}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{s.payee.name}</div>
                        <div className="text-xs text-slate-500">{s.payee.email}</div>
                      </td>
                      <td className="p-4 font-bold text-slate-700">{s.amount}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                          ${s.status === 'Completed' ? 'bg-green-100 text-green-700' :
                            s.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-700'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {s.status === 'Pending' && (
                          <button
                            onClick={() => markAsPaid(s.id)}
                            disabled={processingId === s.id}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                          >
                            {processingId === s.id ? 'Saving...' : 'Mark Paid'}
                          </button>
                        )}
                        {s.status === 'Completed' && <span className="text-green-600 text-sm">✅ Paid</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
