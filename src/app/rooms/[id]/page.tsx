"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/components/Room/Room.module.css';
import SignatureModal from '@/components/SignatureModal/SignatureModal';

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

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'negotiation', label: 'Negotiation', icon: '🤝' },
  { id: 'documents', label: 'Documents', icon: '📄' },
  { id: 'messages', label: 'Messages', icon: '💬' },
  { id: 'settlement', label: 'Settlement', icon: '💰' },
  { id: 'audit', label: 'Audit', icon: '📋' },
];

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

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
          creatorId: room.participants[0]?.user.id || 'demo-user',
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
          senderId: room.participants[0]?.user.id || 'demo-user',
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
      .filter(p => p.user.id !== room.participants[0]?.user.id) // Demo: assume 0 is current
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
          payerId: room.participants[0]?.user.id,
          payeeId: room.participants[1]?.user.id || room.participants[0]?.user.id,
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

  const handleGenerateDocument = async () => {
    if (!room) return;
    try {
      const res = await fetch(`/api/rooms/${room.id}/documents/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType: 'NDA',
          creatorId: room.participants[0]?.user.id // Demo: assume current user is first participant
        })
      });
      if (res.ok) fetchRoom(); // Refresh room to show new doc
    } catch (err) { console.error('Generate failed:', err); }
  };

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
          userId: room.participants[0]?.user.id, // Demo user
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
                  Proceed to Signing
                </button>
              )}
              {room.status === 'Signing' && (
                <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => handleStatusChange('Settling')}>
                  Proceed to Settlement
                </button>
              )}
              {room.status === 'Settling' && (
                <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => handleStatusChange('Completed')}>
                  Complete Deal
                </button>
              )}
              {room.status !== 'Completed' && room.status !== 'Terminated' && (
                <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => handleStatusChange('Terminated')}>
                  Terminate
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
                  <h3 className={styles.panelTitle}>📋 IP Listing</h3>
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
                </div>

                <div className={styles.panel}>
                  <h3 className={styles.panelTitle}>📊 Room Summary</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent)' }}>{room.offers.length}</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Offers</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent)' }}>{room.documents.length}</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Documents</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent)' }}>{room.participants.length}</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Participants</div>
                    </div>
                  </div>
                </div>

                <div className={styles.panel}>
                  <h3 className={styles.panelTitle}>📅 Activity</h3>
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
                    <h3 className={styles.panelTitle} style={{ marginBottom: 0 }}>🤝 Offer Timeline</h3>
                    <button
                      className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                      onClick={() => setShowOfferForm(!showOfferForm)}
                    >
                      {showOfferForm ? 'Cancel' : '+ New Offer'}
                    </button>
                  </div>

                  {/* New Offer Form */}
                  {showOfferForm && (
                    <div className={styles.offerForm} style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Price / Proposed Amount</label>
                        <input
                          className={styles.formInput}
                          placeholder="e.g., 500M KRW"
                          value={offerPrice}
                          onChange={e => setOfferPrice(e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Message / Terms</label>
                        <textarea
                          className={styles.formTextarea}
                          placeholder="Describe your offer terms..."
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
                        {isSubmitting ? 'Submitting...' : 'Submit Offer'}
                      </button>
                    </div>
                  )}

                  {/* Offers */}
                  {room.offers.length === 0 ? (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>💬</div>
                      <h3 className={styles.emptyTitle}>No offers yet</h3>
                      <p className={styles.emptyDesc}>Submit the first offer to start negotiating.</p>
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
                          {offer.status === 'Sent' && offer.createdBy.id !== room.participants[0]?.user.id && (
                            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                              <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => handleOfferAction(offer.id, 'Accepted')} style={{ padding: '6px 12px', fontSize: '13px' }}>Accept</button>
                              <button className={styles.actionBtn} onClick={() => setShowOfferForm(true)} style={{ padding: '6px 12px', fontSize: '13px' }}>Counter</button>
                              <button className={styles.actionBtn} onClick={() => handleOfferAction(offer.id, 'Rejected')} style={{ padding: '6px 12px', fontSize: '13px', color: '#ef4444' }}>Reject</button>
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
                    <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={handleGenerateDocument}>+ Generate NDA</button>
                    <button className={styles.actionBtn}>+ Upload</button>
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
                      const mySignRequest = doc.signatureRequests?.find((sr: any) => sr.signerId === room.participants[0]?.user.id);
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
                            {doc.signatureStatus === 'Draft' && doc.uploadedBy.id === room.participants[0]?.user.id && (
                              <button
                                className={styles.actionBtn}
                                onClick={() => handleRequestSignature(doc.id)}
                                style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--accent)' }}
                              >
                                ✉️ Request Sign
                              </button>
                            )}
                            <button className={styles.actionBtn} style={{ padding: '6px 12px', fontSize: '12px' }}>View</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
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
            )}

            {/* Settlement Tab */}
            {activeTab === 'settlement' && (
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
            )}

            {/* Audit Tab */}
            {activeTab === 'audit' && (
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
            )}
          </div>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>👥 Participants</h3>
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
              <h3 className={styles.panelTitle}>✅ Checklist</h3>
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
          </aside>
        </div>
      </div>
      <SignatureModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        onSign={handleConfirmSignature}
        documentTitle={room.documents?.find((d: any) => d.id === signingDocId)?.fileName || 'Document'}
      />
    </main>
  );
}
