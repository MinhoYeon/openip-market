import React, { useState, useEffect } from 'react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: (signatureData: string) => Promise<void>;
  documentTitle: string;
}

export default function SignatureModal({ isOpen, onClose, onSign, documentTitle }: SignatureModalProps) {
  const [signatureType, setSignatureType] = useState('type');
  const [typedName, setTypedName] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  if (!isOpen) return null;

  const handleSign = async () => {
    if (signatureType === 'type' && !typedName.trim()) return;

    setIsSigning(true);
    await onSign(signatureType === 'type' ? typedName : 'Draw_Signature_Mock_Data');
    setIsSigning(false);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        backgroundColor: '#1e1e1e', padding: '24px', borderRadius: '16px',
        width: '500px', maxWidth: '90%', border: '1px solid var(--glass-border)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ✍️ Sign Document
        </h3>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>
          You are signing: <strong style={{ color: 'var(--foreground)' }}>{documentTitle}</strong>
        </p>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <button
            onClick={() => setSignatureType('type')}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
              background: signatureType === 'type' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
              color: '#000', cursor: 'pointer', fontWeight: 600
            }}
          >Type</button>
          <button
            onClick={() => setSignatureType('draw')}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
              background: signatureType === 'draw' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
              color: '#000', cursor: 'pointer', fontWeight: 600
            }}
          >Draw</button>
        </div>

        <div style={{
          height: '150px', backgroundColor: '#fff', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '20px', position: 'relative'
        }}>
          {signatureType === 'type' ? (
            <input
              autoFocus
              placeholder="Type your name"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              style={{
                fontSize: '32px', fontFamily: '"Dancing Script", cursive',
                border: 'none', background: 'transparent', textAlign: 'center', width: '100%', outline: 'none', color: '#000'
              }}
            />
          ) : (
            <span style={{ color: '#ccc', fontStyle: 'italic' }}>🖊️ [Mouse Drawing Area Placeholder]</span>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px', borderRadius: '8px', border: 'none',
              backgroundColor: 'transparent', color: 'var(--muted)', cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSign}
            disabled={isSigning || (signatureType === 'type' && !typedName.trim())}
            style={{
              padding: '10px 24px', borderRadius: '8px', border: 'none',
              backgroundColor: 'var(--accent)', color: '#000', fontWeight: 600, cursor: 'pointer',
              opacity: (signatureType === 'type' && !typedName.trim()) ? 0.5 : 1
            }}
          >
            {isSigning ? 'Signing...' : 'Confirm Signature'}
          </button>
        </div>
      </div>
    </div>
  );
}
