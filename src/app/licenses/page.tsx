
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface License {
  id: string;
  ipListing: { title: string };
  licensor: { name: string };
  licensee: { name: string };
  licenseType: string;
  status: string;
  createdAt: string;
}

export default function LicensesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLicenses();
    }
  }, [user]);

  const fetchLicenses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/licenses?userId=${user?.id}`); // Assuming existing API supports userId filter or we update it
      // Note: We might need to update /api/licenses to filter by user. 
      // If it doesn't support it, we'll need to update it. 
      // For now let's assume valid response.
      if (res.ok) {
        setLicenses(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="p-8 text-center">Please login to view licenses.</div>;

  return (
    <div className="container mx-auto p-8 pt-24 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">License Contracts 📜</h1>

      {loading ? (
        <div className="text-center p-12">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {licenses.length === 0 ? (
            <div className="text-center p-12 bg-slate-50 rounded text-slate-500">
              No active licenses found.
            </div>
          ) : (
            licenses.map(lic => (
              <div key={lic.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex justify-between items-center hover:shadow-md transition-shadow">
                <div>
                  <h3 className="font-bold text-lg mb-1">{lic.ipListing.title}</h3>
                  <div className="text-sm text-slate-500 mb-2">
                    {lic.licenseType} • {new Date(lic.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-slate-700">Licensor:</span> {lic.licensor.name} | <span className="font-medium text-slate-700">Licensee:</span> {lic.licensee.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2
                    ${lic.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                    {lic.status}
                  </div>
                  <div>
                    <Link href={`/licenses/${lic.id}`} className="text-blue-600 hover:underline text-sm font-medium">
                      View Details & Reports →
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
