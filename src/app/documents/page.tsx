"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import SignatureModal from '@/components/SignatureModal/SignatureModal';

interface Document {
  id: string;
  fileName: string;
  documentType: string;
  signatureStatus: string;
  createdAt: string;
  room: { id: string; title: string };
  uploadedBy: { id: string; name: string };
  signatureRequests: { id: string; signerId: string; status: string; signer: { name: string } }[];
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  // Signature Modal State
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signingDocId, setSigningDocId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDocuments() {
      if (!user) return;

      try {
        const res = await fetch(`/api/documents?userId=${user.id}`);
        if (res.ok) {
          setDocuments(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch documents:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDocuments();
  }, [user]);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Signed': return 'status-success';
      case 'SignRequested': return 'status-pending';
      case 'Draft': return 'status-neutral';
      case 'Rejected': return 'status-error';
      default: return 'status-neutral';
    }
  };

  const myActionRequired = (doc: Document) => {
    if (!user) return false;
    const myReq = doc.signatureRequests.find(r => r.signerId === user.id);
    return myReq?.status === 'Pending';
  };

  const filteredDocs = documents.filter(doc => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Action Required') return myActionRequired(doc);
    if (activeTab === 'Completed') return doc.signatureStatus === 'Signed' || doc.signatureStatus === 'Rejected';
    return true;
  });

  const openSignModal = (docId: string) => {
    setSigningDocId(docId);
    setIsSignModalOpen(true);
  };

  const handleConfirmSignature = async (signatureData: string) => {
    if (!signingDocId || !user) return;

    try {
      const res = await fetch(`/api/documents/${signingDocId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerId: user.id,
          action: 'sign',
          signatureData // In a real app, save this. For now we just mark signed.
        })
      });

      if (res.ok) {
        // Refresh list
        const updated = await res.json();
        setDocuments(prev => prev.map(d => d.id === updated.id ? updated : d));
        setIsSignModalOpen(false);
        setSigningDocId(null);
      } else {
        alert('Failed to sign document');
      }
    } catch (err) {
      console.error(err);
      alert('Error signing document');
    }
  };

  return (
    <main style={{ minHeight: '100vh', padding: '100px 0', background: 'var(--background)' }}>
      <div className="container">
        {/* Simple Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <Link href="/" style={{ textDecoration: 'none', color: 'var(--muted)', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
              ← Back to Home
            </Link>
            <h1 style={{ fontSize: '36px' }}>My <span className="gradient-text">Documents</span></h1>
          </div>
          <div className="glass-card" style={{ padding: '12px 24px' }}>
            User: <strong>{user?.name}</strong> ({user?.role})
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          {['All', 'Action Required', 'Completed'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? 'btn-primary' : 'glass-card'}
              style={{ padding: '10px 20px', border: 'none', cursor: 'pointer', borderRadius: '8px' }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>Loading documents...</div>
          ) : filteredDocs.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)' }}>
              No documents found in this category.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--glass-border)' }}>
                <tr>
                  <th style={{ padding: '16px', fontSize: '12px', color: 'var(--muted)' }}>DOCUMENT</th>
                  <th style={{ padding: '16px', fontSize: '12px', color: 'var(--muted)' }}>ROOM</th>
                  <th style={{ padding: '16px', fontSize: '12px', color: 'var(--muted)' }}>TYPE</th>
                  <th style={{ padding: '16px', fontSize: '12px', color: 'var(--muted)' }}>STATUS</th>
                  <th style={{ padding: '16px', fontSize: '12px', color: 'var(--muted)' }}>CREATED</th>
                  <th style={{ padding: '16px', fontSize: '12px', color: 'var(--muted)' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map(doc => {
                  const isMyTurn = myActionRequired(doc);
                  return (
                    <tr key={doc.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '16px', fontWeight: 600 }}>{doc.fileName}</td>
                      <td style={{ padding: '16px' }}>
                        <Link href={`/rooms/${doc.room.id}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                          {doc.room.title}
                        </Link>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          background: 'rgba(255,255,255,0.1)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          {doc.documentType}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span className={getStatusClass(doc.signatureStatus)} style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          background: doc.signatureStatus === 'Signed' ? 'rgba(76, 175, 80, 0.2)' :
                            doc.signatureStatus === 'SignRequested' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255,255,255,0.1)',
                          color: doc.signatureStatus === 'Signed' ? '#4caf50' :
                            doc.signatureStatus === 'SignRequested' ? '#ff9800' : 'inherit'
                        }}>
                          {doc.signatureStatus}
                          {doc.signatureStatus === 'SignRequested' && (
                            <span style={{ opacity: 0.6, fontSize: '10px', marginLeft: '4px' }}>
                              ({doc.signatureRequests.filter(r => r.status === 'Signed').length}/{doc.signatureRequests.length})
                            </span>
                          )}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: 'var(--muted)' }}>
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px' }}>
                        {isMyTurn ? (
                          <button
                            className="btn-primary"
                            style={{ padding: '8px 16px', fontSize: '12px' }}
                            onClick={() => openSignModal(doc.id)}
                          >
                            ✍️ Sign Now
                          </button>
                        ) : (
                          <button className="glass-card" style={{ padding: '8px 16px', fontSize: '12px', border: 'none' }}>
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <SignatureModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        onSign={handleConfirmSignature}
        documentTitle={documents.find(d => d.id === signingDocId)?.fileName || 'Document'}
      />
    </main>
  );
}
