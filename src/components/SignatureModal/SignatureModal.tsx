import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/i18n-context';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: (signatureData: string) => Promise<void>;
  documentTitle: string;
}

export default function SignatureModal({ isOpen, onClose, onSign, documentTitle }: SignatureModalProps) {
  const { t } = useTranslation();
  const [signatureType, setSignatureType] = useState('type');
  const [typedName, setTypedName] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  // Canvas Refs & State
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  if (!isOpen) return null;

  // Drawing Handlers
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }
  };

  const handleSign = async () => {
    if (signatureType === 'type' && !typedName.trim()) return;
    if (signatureType === 'draw' && !hasDrawn) return;

    setIsSigning(true);

    let signatureData = '';
    if (signatureType === 'type') {
      signatureData = `Type:${typedName}`;
    } else {
      // Export canvas as image
      signatureData = canvasRef.current?.toDataURL() || 'Empty_Canvas';
    }

    await onSign(signatureData);
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
          ✍️ {t('signature.title')}
        </h3>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>
          {t('signature.signing_prefix')} <strong style={{ color: 'var(--foreground)' }}>{documentTitle}</strong>
        </p>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <button
            onClick={() => setSignatureType('type')}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
              background: signatureType === 'type' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
              color: '#000', cursor: 'pointer', fontWeight: 600
            }}
          >{t('signature.type')}</button>
          <button
            onClick={() => setSignatureType('draw')}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
              background: signatureType === 'draw' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
              color: '#000', cursor: 'pointer', fontWeight: 600
            }}
          >{t('signature.draw')}</button>
        </div>

        <div style={{
          height: '200px', backgroundColor: '#fff', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '10px', position: 'relative', overflow: 'hidden'
        }}>
          {signatureType === 'type' ? (
            <input
              autoFocus
              placeholder={t('signature.placeholder')}
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              style={{
                fontSize: '32px', fontFamily: '"Dancing Script", cursive',
                border: 'none', background: 'transparent', textAlign: 'center', width: '100%', outline: 'none', color: '#000'
              }}
            />
          ) : (
            <canvas
              ref={canvasRef}
              width={450}
              height={200}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              style={{ cursor: 'crosshair', touchAction: 'none' }}
            />
          )}
        </div>

        {signatureType === 'draw' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <button onClick={clearCanvas} style={{ fontSize: '12px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', textDecoration: 'underline' }}>
              {t('signature.clear')}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: signatureType === 'type' ? '20px' : '0' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px', borderRadius: '8px', border: 'none',
              backgroundColor: 'transparent', color: 'var(--muted)', cursor: 'pointer'
            }}
          >
            {t('signature.cancel')}
          </button>
          <button
            onClick={handleSign}
            disabled={isSigning || (signatureType === 'type' ? !typedName.trim() : !hasDrawn)}
            style={{
              padding: '10px 24px', borderRadius: '8px', border: 'none',
              backgroundColor: 'var(--accent)', color: '#000', fontWeight: 600, cursor: 'pointer',
              opacity: (signatureType === 'type' ? !typedName.trim() : !hasDrawn) ? 0.5 : 1
            }}
          >
            {isSigning ? t('signature.signing') : t('signature.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
