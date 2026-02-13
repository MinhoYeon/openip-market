
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface RoyaltyReport {
  id: string;
  period: string;
  grossRevenue: string;
  royaltyAmount: string;
  status: string;
  createdAt: string;
}

interface License {
  id: string;
  ipListing: { title: string };
  licensor: { id: string, name: string, email: string };
  licensee: { id: string, name: string, email: string };
  licenseType: string;
  territory: string;
  duration: string;
  royaltyRate: string;
  upfrontFee: string;
  status: string;
  effectiveDate: string;
  expirationDate: string;
}

export default function LicenseDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [license, setLicense] = useState<License | null>(null);
  const [reports, setReports] = useState<RoyaltyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);

  // Form State
  const [period, setPeriod] = useState('');
  const [grossRevenue, setGrossRevenue] = useState('');
  const [royaltyAmount, setRoyaltyAmount] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');

  useEffect(() => {
    if (id && user) {
      fetchData();
    }
  }, [id, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const licRes = await fetch(`/api/licenses/${id}`); // Need to ensure this endpoint exists or create it
      const repRes = await fetch(`/api/licenses/${id}/reports`);

      if (licRes.ok) setLicense(await licRes.json());
      if (repRes.ok) setReports(await repRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Submit this royalty report?')) return;

    try {
      const res = await fetch(`/api/licenses/${id}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, grossRevenue, royaltyAmount, evidenceUrl })
      });

      if (res.ok) {
        alert('Report submitted successfully.');
        setShowReportForm(false);
        setPeriod('');
        setGrossRevenue('');
        setRoyaltyAmount('');
        fetchData(); // refresh
      } else {
        alert('Failed to submit report.');
      }
    } catch (e) {
      console.error(e);
      alert('Error submitting report.');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!license) return <div className="p-8 text-center text-red-500">License not found or access denied.</div>;

  const isLicensee = user?.id === license.licensee.id;

  return (
    <div className="max-w-4xl mx-auto p-8 pt-24 min-h-screen">
      <Link href="/licenses" className="text-slate-500 hover:text-slate-800 mb-4 inline-block">← Back to Licenses</Link>

      {/* License Header */}
      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{license.ipListing.title}</h1>
            <div className="text-slate-500 text-sm">Contract ID: {license.id}</div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-semibold
                ${license.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
            {license.status}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Parties</h3>
            <p><span className="text-slate-500">Licensor:</span> {license.licensor.name}</p>
            <p><span className="text-slate-500">Licensee:</span> {license.licensee.name}</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Terms</h3>
            <p><span className="text-slate-500">Type:</span> {license.licenseType}</p>
            <p><span className="text-slate-500">Territory:</span> {license.territory || 'N/A'}</p>
            <p><span className="text-slate-500">Duration:</span> {license.duration || 'N/A'}</p>
            <p><span className="text-slate-500">Royalty:</span> {license.royaltyRate || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Royalty Reports Section */}
      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Royalty Reports 📊</h2>
          {isLicensee && (
            <button
              onClick={() => setShowReportForm(!showReportForm)}
              className="btn-primary"
            >
              {showReportForm ? 'Cancel' : '+ Submit Report'}
            </button>
          )}
        </div>

        {/* Submission Form */}
        {showReportForm && (
          <form onSubmit={submitReport} className="mb-8 p-6 bg-slate-50 rounded border border-slate-200">
            <h3 className="font-bold mb-4">New Royalty Report</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Period</label>
                <input
                  type="text"
                  placeholder="e.g. 2026-Q1"
                  className="input-field w-full"
                  value={period}
                  onChange={e => setPeriod(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Evidence URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  className="input-field w-full"
                  value={evidenceUrl}
                  onChange={e => setEvidenceUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Gross Revenue (KRW)</label>
                <input
                  type="text"
                  placeholder="100,000,000"
                  className="input-field w-full"
                  value={grossRevenue}
                  onChange={e => setGrossRevenue(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Royalty Amount (KRW)</label>
                <input
                  type="text"
                  placeholder="5,000,000"
                  className="input-field w-full"
                  value={royaltyAmount}
                  onChange={e => setRoyaltyAmount(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="text-right">
              <button type="submit" className="btn-primary">Submit Report</button>
            </div>
          </form>
        )}

        {/* Reports List */}
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-3 font-semibold text-slate-500">Date</th>
              <th className="p-3 font-semibold text-slate-500">Period</th>
              <th className="p-3 font-semibold text-slate-500">Gross Revenue</th>
              <th className="p-3 font-semibold text-slate-500">Royalty</th>
              <th className="p-3 font-semibold text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500">No reports submitted yet.</td>
              </tr>
            ) : (
              reports.map(rep => (
                <tr key={rep.id}>
                  <td className="p-3">{new Date(rep.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 font-medium">{rep.period}</td>
                  <td className="p-3">{rep.grossRevenue}</td>
                  <td className="p-3 font-bold text-slate-700">{rep.royaltyAmount}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                    ${rep.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {rep.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
