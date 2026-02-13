"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import styles from '@/components/Room/Room.module.css';
import SignatureModal from '@/components/SignatureModal/SignatureModal';
import { useTranslation } from '@/lib/i18n/i18n-context';

interface RoomDetail {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  ipListing: {
    id: string; title: string; ipType: string; industry: string;
    priceExpectation: string; visibility: string; status: string;
    owner: { id: string; name: string; role: string };
  };
  participants: { id: string; user: { id: string; name: string; email: string; role: string }; role: string }[];
  offers: {
    id: string; version: number; price: string; terms: string;
    message: string; status: string; createdAt: string;
    createdBy: { id: string; name: string; role: string };
  }[];
  documents: {
    id: string; fileName: string; fileUrl: string; documentType: string;
    signatureStatus: string; version: number; createdAt: string;
    uploadedBy: { id: string; name: string };
    signatureRequests: { id: string; signerId: string; status: string }[];
  }[];
}

const ROOM_STEPS = ['Setup', 'Negotiating', 'Signing', 'Settling', 'Completed'];

/* Moved TABS inside component for translation */

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab');

  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab || 'overview');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // User Simulation State
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string } | null>(null);

  useEffect(() => {
    if (room && room.participants.length > 0 && !currentUser) {
      // Default to the first participant (usually Buyer if creator)
      setCurrentUser(room.participants[0].user);
    }
  }, [room, currentUser]);

  const handleSwitchUser = (role: string) => {
    if (!room) return;
    const p = room.participants.find(p => p.role === role);
    if (p) setCurrentUser({ ...p.user, role: p.role });
  };

  const isMyOffer = (offerCreatorId: string) => {
    // If user is participating as multiple roles (self-dealing/test), always show actions
    const myRoles = room?.participants.filter(p => p.user.id === currentUser?.id);
    if (myRoles && myRoles.length > 1) return false;
    return currentUser?.id === offerCreatorId;
  };

  const TABS = [
    { id: 'overview', label: t('room.tabs.overview'), icon: '📊' },
    { id: 'negotiation', label: t('room.tabs.negotiation'), icon: '🤝' },
    { id: 'documents', label: t('room.tabs.documents'), icon: '📄' },
    { id: 'messages', label: t('room.tabs.messages'), icon: '💬' },
    { id: 'settlement', label: t('room.tabs.settlement'), icon: '💰' },
    { id: 'audit', label: t('room.tabs.audit'), icon: '📋' },
  ];

  // Offer form state
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Messages state
  const [messages, setMessages] = useState<any[]>([]);
  const [msgText, setMsgText] = useState('');
  const [msgLoading, setMsgLoading] = useState(false);

  // Settlement state
  const [settlements, setSettlements] = useState<any>({ settlements: [], summary: {} });

  // Audit state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);



  // Signature Modal state
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signingDocId, setSigningDocId] = useState<string | null>(null);

  // Document View Modal state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);

  const fetchRoom = async () => {
    try {
      const { id } = await params;
      const res = await fetch(`/api/rooms/${id}`);
      if (res.ok) setRoom(await res.json());
    } catch (err) {
      console.error('Failed to fetch room:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoom();
  }, [params]);

  // Fetch tab-specific data
  useEffect(() => {
    if (!room) return;
    if (activeTab === 'messages' && messages.length === 0) {
      fetch(`/api/rooms/${room.id}/messages`).then(r => r.json()).then(setMessages).catch(console.error);
    }
    if (activeTab === 'settlement') {
      fetch(`/api/rooms/${room.id}/settlement`).then(r => r.json()).then(setSettlements).catch(console.error);
    }
    if (activeTab === 'audit' && auditLogs.length === 0) {
      fetch(`/api/rooms/${room.id}/audit`).then(r => r.json()).then(setAuditLogs).catch(console.error);
    }
  }, [activeTab, room]);

  const handleSubmitOffer = async () => {
    if (!room || !offerPrice) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/rooms/${room.id}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: currentUser?.id,
          price: offerPrice,
          message: offerMessage,
          status: 'Sent'
        })
      });
      if (res.ok) {
        const newOffer = await res.json();
        setRoom(prev => prev ? { ...prev, offers: [newOffer, ...prev.offers] } : prev);
        setOfferPrice('');
        setOfferMessage('');
        setShowOfferForm(false);
      }
    } catch (err) {
      console.error('Failed to submit offer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!room) return;
    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setRoom(prev => prev ? { ...prev, status: updated.status } : prev);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!room || !msgText.trim()) return;
    setMsgLoading(true);
    try {
      const res = await fetch(`/api/rooms/${room.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser?.id,
          content: msgText.trim()
        })
      });
      if (res.ok) {
        const newMsg = await res.json();
        setMessages(prev => [...prev, newMsg]);
        setMsgText('');
      }
    } catch (err) { console.error('Send failed:', err); }
    finally { setMsgLoading(false); }
  };

  const handleOfferAction = async (offerId: string, action: 'Accepted' | 'Rejected') => {
    if (!room) return;
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action, roomId: room.id })
      });
      if (res.ok) fetchRoom();
    } catch (err) { console.error('Offer action failed:', err); }
  };

  const handleRequestSignature = async (documentId: string) => {
    if (!room) return;
    // For demo, we request signature from all other participants
    const otherSignerIds = room.participants
      .filter(p => p.user.id !== currentUser?.id)
      .map(p => p.user.id);

    if (otherSignerIds.length === 0) return alert('No other participants to sign');

    try {
      const res = await fetch(`/api/documents/${documentId}/sign-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signerIds: otherSignerIds })
      });
      if (res.ok) fetchRoom();
    } catch (err) { console.error('Sign request failed:', err); }
  };

  const handleSettlementAction = async (action: string, settlementId?: string) => {
    if (!room) return;
    try {
      const res = await fetch(`/api/rooms/${room.id}/settlement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          settlementId,
          payerId: currentUser?.id,
          payeeId: room.participants.find(p => p.user.id !== currentUser?.id)?.user.id,
          amount: action === 'create' ? prompt('정산 금액을 입력하세요 (예: 500M KRW):') || '0' : undefined,
          paymentType: 'Upfront'
        })
      });
      if (res.ok) {
        // Refresh settlements
        const updated = await fetch(`/api/rooms/${room.id}/settlement`);
        if (updated.ok) setSettlements(await updated.json());
      }
    } catch (err) { console.error('Settlement action failed:', err); }
  };

  const handleGenerateDocument = async (templateType: string = 'NDA') => {
    if (!room) return;
    try {
      const res = await fetch(`/api/rooms/${room.id}/documents/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType,
          creatorId: currentUser?.id
        })
      });
      if (res.ok) fetchRoom(); // Refresh room to show new doc
    } catch (err) { console.error('Generate failed:', err); }
  };

  const handleViewDocument = (doc: any) => {
    setViewingDoc(doc);
    setIsViewModalOpen(true);
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await fetch(`/api/documents/${docId}?userId=${currentUser?.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchRoom(); // Refresh list
      } else {
        const err = await res.json();
        alert(`Failed to delete: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting document');
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !room) return;

    try {
      // Mock upload - in real app, use FormData to /api/upload
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room.id,
          uploaderId: currentUser.id,
          fileName: file.name,
          fileData: 'mock_base64_content'
        })
      });

      if (res.ok) {
        fetchRoom();
      } else {
        alert('Upload failed');
      }
    } catch (error) {
      console.error(error);
      alert('Upload error');
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Missing functions restored
  const openSignModal = (docId: string) => {
    setSigningDocId(docId);
    setIsSignModalOpen(true);
  };

  const handleConfirmSignature = async (signatureData: string) => {
    if (!room || !signingDocId) return;
    try {
      const res = await fetch(`/api/documents/${signingDocId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerId: currentUser?.id,
          action: 'sign',
          signatureData
        })
      });
      if (res.ok) {
        fetchRoom(); // Refresh status
        setIsSignModalOpen(false);
        setSigningDocId(null);
      }
    } catch (err) { console.error('Sign failed:', err); }
  };

  if (isLoading) return <main className={styles.roomDetailContainer}><div className="container"><div className={styles.spinner} /></div></main>;
  if (!room) return <main className={styles.roomDetailContainer}><div className="container"><div className={styles.emptyState}><h3>Room not found</h3></div></div></main>;

  const currentStepIdx = ROOM_STEPS.indexOf(room.status);

  const getSignClass = (s: string) => {
    const m: Record<string, string> = { Draft: styles.signDraft, Shared: styles.signShared, SignRequested: styles.signRequested, Signed: styles.signSigned };
    return m[s] || styles.signDraft;
  };

  const getStatusClass = (status: string) => {
    const map: Record<string, string> = { Setup: styles.statusSetup, Negotiating: styles.statusNegotiating, Signing: styles.statusSigning, Settling: styles.statusSettling, Completed: styles.statusCompleted, Terminated: styles.statusTerminated };
    return map[status] || styles.statusSetup;
  };

  const getTypeClass = (type: string) => {
    if (type === 'Deal') return styles.typeDeal;
    if (type === 'License') return styles.typeLicense;
    return styles.typeValuation;
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <main className={styles.roomDetailContainer}>
      {/* Dev Tool: User Switcher */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: 'var(--card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--accent)', zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        <h4 style={{ fontSize: '12px', marginBottom: '8px', color: 'var(--muted)' }}>MODE SIMULATOR</h4>
        <select
          style={{ padding: '8px', borderRadius: '6px', background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--glass-border)', width: '100%' }}
          value={currentUser?.role || ''}
          onChange={(e) => handleSwitchUser(e.target.value)}
        >
          {room?.participants.map(p => (
            <option key={p.id} value={p.role}>{p.role} ({p.user.name})</option>
          ))}
        </select>
        <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--accent)' }}>
          Active: {currentUser?.name}
        </div>
        <button onClick={() => window.location.href = '/login'} style={{ marginTop: '8px', width: '100%', padding: '6px', background: 'var(--primary)', border: 'none', borderRadius: '4px', color: 'white', fontSize: '11px', cursor: 'pointer' }}>
          Force Logout
        </button>
      </div>

      <div className="container">
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link href="/rooms">Rooms</Link>
          <span>›</span>
          <span>{room.type}</span>
          <span>›</span>
          <span style={{ color: 'var(--foreground)' }}>{room.title}</span>
        </div>

        {/* Header */}
        <div className={styles.roomHeader}>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.roomDetailTitle}>{room.title}</h1>
              <div className={styles.headerBadges}>
                <span className={`${styles.roomType} ${getTypeClass(room.type)}`}>{room.type}</span>
                <span className={`${styles.roomStatus} ${getStatusClass(room.status)}`}>{room.status}</span>
              </div>
            </div>
            <div className={styles.headerActions}>
              {room.status === 'Negotiating' && (
                <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => handleStatusChange('Signing')}>
                  {t('room.actions.proceed')} (Signing)
                </button>
              )}
              {room.status === 'Signing' && (
                <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => handleStatusChange('Settling')}>
                  {t('room.actions.proceed')} (Settlement)
                </button>
              )}
              {room.status === 'Settling' && (
                <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => handleStatusChange('Completed')}>
                  {t('room.actions.proceed')} (Complete)
                </button>
              )}
              {room.status !== 'Completed' && room.status !== 'Terminated' && (
                <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => handleStatusChange('Terminated')}>
                  {t('room.actions.terminate')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Stepper */}
        <div className={styles.stepper}>
          {ROOM_STEPS.map((step, i) => (
            <div key={step} className={`${styles.step} ${i < currentStepIdx ? styles.stepCompleted : ''} ${i === currentStepIdx ? styles.stepActive : ''}`}>
              <div className={styles.stepDot}>{i < currentStepIdx ? '✓' : i + 1}</div>
              <div className={styles.stepLabel}>{step}</div>
              {i < ROOM_STEPS.length - 1 && <div className={styles.stepLine} />}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className={styles.detailTabs}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`${styles.detailTab} ${activeTab === tab.id ? styles.detailTabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
              {tab.id === 'negotiation' && room.offers.length > 0 && <span className={styles.tabBadge}>{room.offers.length}</span>}
              {tab.id === 'documents' && room.documents.length > 0 && <span className={styles.tabBadge}>{room.documents.length}</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={styles.detailLayout}>
          <div>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                <div className={styles.panel}>
                  <h3 className={styles.panelTitle}>📋 {t('room.labels.ipListing')}</h3>
                  {room.ipListing ? (
                    <>
                      <Link href={`/marketplace/${room.ipListing.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h4 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--accent)' }}>{room.ipListing.title}</h4>
                      </Link>
                      <div style={{ display: 'flex', gap: '16px', color: 'var(--muted)', fontSize: '14px' }}>
                        <span>{room.ipListing.ipType}</span>
                        <span>•</span>
                        <span>{room.ipListing.industry}</span>
                        <span>•</span>
                        <span>{room.ipListing.priceExpectation || 'Negotiable'}</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
                      This room is not linked to a specific IP listing.
                    </div>
                  )}
                </div>

                <div className={styles.panel}>
                  <h3 className={styles.panelTitle}>📊 {t('room.labels.roomSummary')}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent)' }}>{room.offers.length}</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Offers</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent)' }}>{room.documents.length}</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{t('room.tabs.documents')}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent)' }}>{room.participants.length}</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{t('room.labels.participants')}</div>
                    </div>
                  </div>
                </div>

                <div className={styles.panel}>
                  <h3 className={styles.panelTitle}>📅 {t('room.labels.activity')}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted)' }}>Created</span>
                      <span>{formatDate(room.createdAt)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted)' }}>Last Updated</span>
                      <span>{formatDate(room.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Negotiation Tab */}
            {activeTab === 'negotiation' && (
              <>
                <div className={styles.panel}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 className={styles.panelTitle} style={{ marginBottom: 0 }}>🤝 {t('room.labels.offerTimeline')}</h3>
                    <button
                      className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                      onClick={() => setShowOfferForm(!showOfferForm)}
                    >
                      {showOfferForm ? t('room.actions.cancel') : `+ ${t('room.actions.newOffer')}`}
                    </button>
                  </div>

                  {/* New Offer Form */}
                  {showOfferForm && (
                    <div className={styles.offerForm} style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('room.labels.price')}</label>
                        <input
                          className={styles.formInput}
                          placeholder="e.g., 500M KRW"
                          value={offerPrice}
                          onChange={e => setOfferPrice(e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('room.labels.message')}</label>
                        <textarea
                          className={styles.formTextarea}
                          placeholder={t('room.labels.describeOffer')}
                          value={offerMessage}
                          onChange={e => setOfferMessage(e.target.value)}
                        />
                      </div>
                      <button
                        className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                        onClick={handleSubmitOffer}
                        disabled={isSubmitting || !offerPrice}
                        style={{ alignSelf: 'flex-start' }}
                      >
                        {isSubmitting ? t('common.loading') : t('room.actions.submitOffer')}
                      </button>
                    </div>
                  )}

                  {/* Offers */}
                  {room.offers.length === 0 ? (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>💬</div>
                      <h3 className={styles.emptyTitle}>{t('room.labels.noOffers')}</h3>
                      <p className={styles.emptyDesc}>{t('room.labels.startNegotiation')}</p>
                    </div>
                  ) : (
                    <div className={styles.offerTimeline}>
                      {room.offers.map((offer, i) => (
                        <div key={offer.id} className={`${styles.offerCard} ${i === 0 ? styles.offerCardActive : ''}`}>
                          <div className={styles.offerVersion}>Offer v{offer.version}</div>
                          {offer.price && <div className={styles.offerPrice}>{offer.price}</div>}
                          {offer.message && <div className={styles.offerMessage}>{offer.message}</div>}
                          <div className={styles.offerFooter}>
                            <span>{offer.createdBy.name} ({offer.createdBy.role})</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className={`${styles.roomStatus} ${offer.status === 'Accepted' ? styles.statusCompleted : offer.status === 'Rejected' ? styles.statusTerminated : styles.statusNegotiating}`}>
                                {offer.status}
                              </span>
                              <span>{formatDate(offer.createdAt)}</span>
                            </div>
                          </div>
                          {offer.status === 'Sent' && !isMyOffer(offer.createdBy.id) && (
                            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                              <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => handleOfferAction(offer.id, 'Accepted')} style={{ padding: '6px 12px', fontSize: '13px' }}>{t('room.actions.accept')}</button>
                              <button className={styles.actionBtn} onClick={() => setShowOfferForm(true)} style={{ padding: '6px 12px', fontSize: '13px' }}>{t('room.actions.counter')}</button>
                              <button className={styles.actionBtn} onClick={() => handleOfferAction(offer.id, 'Rejected')} style={{ padding: '6px 12px', fontSize: '13px', color: '#ef4444' }}>{t('room.actions.reject')}</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className={styles.panel}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 className={styles.panelTitle} style={{ marginBottom: 0 }}>📄 Documents</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {room.status === 'Signing' ? (
                      <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => handleGenerateDocument('License')}>+ Generate Contract</button>
                    ) : (
                      <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => handleGenerateDocument('NDA')}>+ Generate NDA</button>
                    )}
                    <button className={styles.actionBtn} onClick={handleUploadClick}>+ Upload</button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                {room.documents.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📁</div>
                    <h3 className={styles.emptyTitle}>No documents yet</h3>
                    <p className={styles.emptyDesc}>Generate or upload documents.</p>
                  </div>
                ) : (
                  <div className={styles.docList} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {room.documents.map((doc: any) => {
                      const mySignRequest = doc.signatureRequests?.find((sr: any) => sr.signerId === currentUser?.id);
                      const isPending = mySignRequest?.status === 'Pending';
                      return (
                        <div key={doc.id} className={styles.docItem} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div className={styles.docIcon} style={{ fontSize: '20px' }}>
                              {doc.documentType === 'NDA' ? '🔒' : doc.documentType === 'License' ? '📜' : '📎'}
                            </div>
                            <div className={styles.docInfo}>
                              <div className={styles.docName} style={{ fontWeight: 600 }}>{doc.fileName}</div>
                              <div className={styles.docMeta} style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                {doc.documentType} • v{doc.version} • {doc.uploadedBy?.name || 'System'} • {new Date(doc.createdAt).toLocaleDateString()}
                                <span style={{ marginLeft: '8px', color: 'var(--accent)' }}>[{doc.signatureStatus || 'Draft'}]</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {isPending && (
                              <button
                                className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                                onClick={() => openSignModal(doc.id)}
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                              >
                                ✍️ Sign Now
                              </button>
                            )}
                            {doc.signatureStatus === 'Draft' && doc.uploadedBy.id === currentUser?.id && (
                              <button
                                className={styles.actionBtn}
                                onClick={() => handleRequestSignature(doc.id)}
                                style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--accent)' }}
                              >
                                ✉️ Request Sign
                              </button>
                            )}

                            <button
                              className={styles.actionBtn}
                              onClick={() => handleViewDocument(doc)}
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              View
                            </button>
                            {doc.uploaderId === currentUser?.id && doc.signatureStatus !== 'Signed' && (
                              <button
                                className={styles.actionBtn}
                                onClick={() => handleDeleteDocument(doc.id)}
                                style={{ padding: '6px 12px', fontSize: '12px', color: '#ef4444', border: '1px solid #ef4444' }}
                                title="Delete Document"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Messages Tab */}
            {
              activeTab === 'messages' && (
                <div className={styles.panel}>
                  <h3 className={styles.panelTitle} style={{ marginBottom: '16px' }}>💬 Messages</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto', marginBottom: '16px', padding: '8px' }}>
                    {messages.length === 0 ? (
                      <div className={styles.emptyState} style={{ padding: '40px' }}>
                        <div className={styles.emptyIcon}>💬</div>
                        <h3 className={styles.emptyTitle}>대화 시작</h3>
                        <p className={styles.emptyDesc}>첫 메시지를 보내보세요.</p>
                      </div>
                    ) : messages.map((msg: any) => (
                      <div key={msg.id} style={{
                        padding: '10px 14px', borderRadius: '10px',
                        background: msg.messageType === 'system' ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.04)',
                        borderLeft: msg.messageType === 'system' ? '3px solid #8b5cf6' : 'none'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, fontSize: '13px' }}>{msg.sender?.name || 'System'}</span>
                          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{new Date(msg.createdAt).toLocaleString('ko-KR')}</span>
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--muted)' }}>{msg.content}</div>
                        {msg.attachmentUrl && (
                          <a href={msg.attachmentUrl} style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '4px', display: 'block' }}>📎 {msg.attachmentName || 'Attachment'}</a>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      className={styles.formInput}
                      placeholder="메시지 입력..."
                      value={msgText}
                      onChange={e => setMsgText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && msgText.trim()) { handleSendMessage(); } }}
                      style={{ flex: 1 }}
                    />
                    <button
                      className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                      onClick={handleSendMessage}
                      disabled={msgLoading || !msgText.trim()}
                    >
                      {msgLoading ? '...' : '전송'}
                    </button>
                  </div>
                </div>
              )
            }

            {/* Settlement Tab */}
            {
              activeTab === 'settlement' && (
                <>
                  <div className={styles.panel}>
                    <h3 className={styles.panelTitle}>💰 정산 요약</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', textAlign: 'center', marginBottom: '16px' }}>
                      <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>{settlements.summary?.totalCount || 0}</div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>총 정산</div>
                      </div>
                      <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(234,179,8,0.1)' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#eab308' }}>{settlements.summary?.pendingCount || 0}</div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>대기중</div>
                      </div>
                      <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>{settlements.summary?.paidCount || 0}</div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>완료</div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.panel}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 className={styles.panelTitle} style={{ marginBottom: 0 }}>📊 정산 내역</h3>
                      <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => handleSettlementAction('create')}>+ 정산 생성</button>
                    </div>
                    {(settlements.settlements || []).length === 0 ? (
                      <div className={styles.emptyState} style={{ padding: '40px' }}>
                        <div className={styles.emptyIcon}>🏦</div>
                        <h3 className={styles.emptyTitle}>정산 내역 없음</h3>
                        <p className={styles.emptyDesc}>{room.status !== 'Settling' && room.status !== 'Completed' ? `현재 상태: ${room.status}` : '정산을 생성하세요.'}</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(settlements.settlements || []).map((s: any) => (
                          <div key={s.id} style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: 600 }}>{s.amount}</div>
                              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{s.payer?.name} → {s.payee?.name} • {s.paymentType}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{
                                fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px',
                                background: s.status === 'Completed' ? 'rgba(16,185,129,0.15)' : s.status === 'Failed' ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)',
                                color: s.status === 'Completed' ? '#10b981' : s.status === 'Failed' ? '#ef4444' : '#eab308'
                              }}>{s.status}</span>
                              {s.status === 'Pending' && (
                                <>
                                  <button className={styles.actionBtn} style={{ fontSize: '11px' }} onClick={() => handleSettlementAction('confirmPayment', s.id)}>✓ 확인</button>
                                  <button className={styles.actionBtn} style={{ fontSize: '11px', color: '#ef4444' }} onClick={() => handleSettlementAction('dispute', s.id)}>⚠ 분쟁</button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )
            }

            {/* Audit Tab */}
            {
              activeTab === 'audit' && (
                <div className={styles.panel}>
                  <h3 className={styles.panelTitle}>📋 Room Activity Timeline</h3>
                  {auditLogs.length === 0 ? (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>📝</div>
                      <h3 className={styles.emptyTitle}>No activity yet</h3>
                      <p className={styles.emptyDesc}>Key milestones will be recorded here.</p>
                    </div>
                  ) : (
                    <div className={styles.timeline}>
                      {auditLogs.map((log: any) => (
                        <div key={log.id} className={styles.timelineItem}>
                          <div className={styles.timelineDot} style={{
                            borderColor: log.action === 'signed' ? '#10b981' : log.action === 'statusChanged' ? '#3b82f6' : 'var(--accent)'
                          }} />
                          <div className={styles.timelineContent}>
                            <div className={styles.timelineHeader}>
                              <div className={styles.timelineTitle}>
                                {log.actor?.name}
                                <span style={{ fontWeight: 400, color: 'var(--muted)', marginLeft: '8px' }}>
                                  {log.action === 'statusChanged' ? 'updated room status' :
                                    log.action === 'messageSent' ? 'sent a message' :
                                      log.action === 'documentUploaded' ? 'uploaded a document' :
                                        log.action === 'signed' ? 'signed the document' :
                                          log.action === 'offerCreated' ? 'sent a new offer' :
                                            log.action === 'settlementCreated' ? 'initiated settlement' : log.action}
                                </span>
                              </div>
                              <div className={styles.timelineDate}>{new Date(log.createdAt).toLocaleString()}</div>
                            </div>
                            {log.detail && (
                              <div className={styles.timelineDesc}>
                                {JSON.parse(log.detail).newStatus ? (
                                  <span>Changed to <strong>{JSON.parse(log.detail).newStatus}</strong></span>
                                ) : log.detail}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            }
          </div >

          {/* Sidebar */}
          < aside className={styles.sidebar} >
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>👥 {t('room.labels.participants')}</h3>
              {room.participants.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: '14px' }}>No participants added yet.</p>
              ) : (
                <div className={styles.participantList}>
                  {room.participants.map(p => (
                    <div key={p.id} className={styles.participant}>
                      <div className={styles.avatar}>{p.user.name?.charAt(0) || '?'}</div>
                      <div className={styles.participantInfo}>
                        <span className={styles.participantName}>{p.user.name}</span>
                        <span className={styles.participantRole}>{p.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>✅ {t('room.labels.checklist')}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                {[
                  { label: 'Room Created', done: true },
                  { label: 'NDA Signed', done: room.documents.some(d => d.documentType === 'NDA' && d.signatureStatus === 'Signed') },
                  { label: 'Offer Accepted', done: room.offers.some(o => o.status === 'Accepted') },
                  { label: 'Contract Signed', done: room.documents.some(d => (d.documentType === 'License' || d.documentType === 'Assignment') && d.signatureStatus === 'Signed') },
                  { label: 'Settlement Complete', done: room.status === 'Completed' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ color: item.done ? '#10b981' : 'var(--muted)' }}>
                      {item.done ? '✅' : '⬜'}
                    </span>
                    <span style={{ color: item.done ? 'var(--foreground)' : 'var(--muted)', textDecoration: item.done ? 'line-through' : 'none' }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside >
        </div >
      </div >
      <SignatureModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        onSign={handleConfirmSignature}
        documentTitle={room.documents?.find((d: any) => d.id === signingDocId)?.fileName || 'Document'}
      />

      {/* Document View Modal */}
      {isViewModalOpen && viewingDoc && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            backgroundColor: '#1e1e1e', width: '800px', maxWidth: '95%', height: '80vh',
            borderRadius: '16px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>📄 {viewingDoc.fileName}</h3>
              <button onClick={() => setIsViewModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Document Content Preview */}
              <div style={{ background: '#fff', color: '#000', padding: '40px', borderRadius: '4px', minHeight: '300px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '40px' }}>{viewingDoc.fileName.replace('.txt', '')}</h2>
                <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'serif', lineHeight: 1.6 }}>
                  {viewingDoc.content || `(This is a placeholder content for ${viewingDoc.fileName}.)\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\n[Content continues...]`}
                </div>

                {/* Signatures Section in Document */}
                <div style={{ marginTop: '60px', borderTop: '2px solid #000', paddingTop: '40px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '40px' }}>
                  {viewingDoc.signatureRequests?.map((req: any) => (
                    <div key={req.id} style={{ minWidth: '200px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>{req.signer?.name || 'Signer'} ({req.status})</div>
                      <div style={{
                        height: '100px', border: '1px solid #ccc', borderRadius: '4px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
                      }}>
                        {req.status === 'Signed' ? (
                          req.signatureData ? (
                            req.signatureData.startsWith('data:image') ? (
                              <img src={req.signatureData} alt="Signature" style={{ maxHeight: '100%', maxWidth: '100%' }} />
                            ) : (
                              <span style={{ fontFamily: '"Dancing Script", cursive', fontSize: '24px' }}>
                                {req.signatureData.replace('Type:', '')}
                              </span>
                            )
                          ) : (
                            <span style={{ color: 'green', fontWeight: 'bold' }}>Signed ✓</span>
                          )
                        ) : (
                          <span style={{ color: '#ccc', fontSize: '12px' }}>Waiting for signature...</span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', marginTop: '4px', color: '#666' }}>
                        Date: {req.signedAt ? new Date(req.signedAt).toLocaleDateString() : '-'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: '16px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className={styles.actionBtn} onClick={() => window.open(viewingDoc.fileUrl, '_blank')}>Download PDF</button>
              <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => setIsViewModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
