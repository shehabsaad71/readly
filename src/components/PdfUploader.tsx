/* ========================================
   FREE PDF TTS READER — PDF Uploader
   by Analyst Sandeep
   Redesign: Editorial Minimal Reader
   Hero + Trust + Upload layout
   ======================================== */

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, AlertCircle, Lock, Wifi, Zap } from 'lucide-react';
import item from '../assets/logo.png';
import SpotlightContainer from './SpotlightContainer';

interface PdfUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  loadingMessage: string;
  loadingProgress: number;
  error: string | null;
  isMobile?: boolean;
}

/** Maximum file size: 100 MB */
const MAX_FILE_SIZE = 100 * 1024 * 1024;

export default function PdfUploader({
  onFileSelect,
  isLoading,
  loadingMessage,
  loadingProgress,
  error,
  isMobile = false,
}: PdfUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(async (file: File): Promise<string | null> => {
    // File size check
    if (file.size > MAX_FILE_SIZE) {
      return `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 100 MB.`;
    }

    // Basic extension check
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return 'Invalid file type. Please upload a PDF file.';
    }

    // Magic bytes check (%PDF)
    try {
      const arrayBuffer = await file.slice(0, 5).arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const header = String.fromCharCode(...bytes);
      if (!header.startsWith('%PDF')) {
        return 'Invalid PDF file. The file does not appear to be a valid PDF document.';
      }
    } catch (err) {
      console.error('Error validating PDF header:', err);
      return 'Could not read file. Please try again.';
    }

    return null; // No error — file is valid
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setUploadError(null);
      const validationError = await validateFile(file);
      if (!validationError) {
        onFileSelect(file);
      } else {
        setUploadError(validationError);
      }
    },
    [onFileSelect, validateFile]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault(); e.stopPropagation(); setIsDragging(false);
      if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const handleClick = useCallback(() => { fileInputRef.current?.click(); }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) handleFile(e.target.files[0]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [handleFile]
  );

  // ---- Loading ----
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: isMobile ? '24px 16px' : '48px' }}>
        <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
          <div style={{ marginBottom: '24px' }}>
            <img
              src={item}
              alt="Loading"
              style={{
                height: isMobile ? '64px' : '80px',
                width: 'auto',
                opacity: 0.9
              }}
            />
          </div>
          <h2 style={{ fontSize: isMobile ? '17px' : '20px', fontWeight: 700, color: 'var(--accent)', marginBottom: '20px', letterSpacing: '-0.02em' }}>
            Loading PDF…
          </h2>
          <div style={{ width: '100%', height: '6px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden', marginBottom: '12px' }}>
            <div className="progress-bar" style={{ width: `${loadingProgress}%`, height: '100%', transition: 'width 0.3s ease' }} />
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{loadingMessage}</p>
          <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[100, 85, 92, 78, 88].map((w, i) => (
              <div key={i} className="skeleton" style={{ height: '14px', width: `${w}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---- Error ----
  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: isMobile ? '24px 16px' : '48px' }}>
        <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', backgroundColor: 'rgba(220, 38, 38, 0.08)', color: 'var(--error)' }}>
            <AlertCircle size={32} />
          </div>
          <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.02em' }}>Failed to Load PDF</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>{error}</p>
          <button onClick={handleClick} className="btn-gradient" style={{ padding: '10px 24px', fontSize: '14px' }}>Try Another File</button>
          <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" onChange={handleInputChange} style={{ display: 'none' }} />
        </div>
      </div>
    );
  }

  // ---- Hero + Trust + Upload ----
  return (
    <SpotlightContainer
      variant="thunder"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: isMobile ? '24px 16px' : '48px 32px',
        backgroundColor: 'var(--bg-primary)',
        overflow: 'auto',
      }}>
      <div style={{
        width: '100%',
        maxWidth: '900px',
        display: isMobile ? 'flex' : 'grid',
        gridTemplateColumns: isMobile ? undefined : '1fr 1fr',
        flexDirection: isMobile ? 'column' : undefined,
        gap: isMobile ? '32px' : '64px',
        alignItems: 'center',
      }}>
        {/* LEFT: Hero + Trust */}
        <div style={{ textAlign: isMobile ? 'center' : 'left', order: isMobile ? 2 : 1 }}>
          <h2 className="no-select" style={{
            fontSize: isMobile ? '28px' : '36px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '12px',
          }}>
            Listen to any PDF
            <span style={{ color: 'var(--accent)' }}> locally</span>
          </h2>

          <p style={{
            fontSize: isMobile ? '15px' : '16px',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            marginBottom: '24px',
            maxWidth: '380px',
            marginLeft: isMobile ? 'auto' : undefined,
            marginRight: isMobile ? 'auto' : undefined,
          }}>
            No uploads. No tracking. Everything runs in your browser.
          </p>

          {/* Trust badges */}
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            justifyContent: isMobile ? 'center' : 'flex-start',
            marginBottom: '32px',
          }}>
            {[
              { icon: <Lock size={14} />, label: 'Private' },
              { icon: <Zap size={14} />, label: 'Free' },
              { icon: <Wifi size={14} />, label: 'Offline-first' },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                }}
              >
                <span style={{ color: 'var(--accent)' }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>

          {/* How it works — mini guide */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              How it works
            </p>
            {[
              { step: '1', text: 'Upload a PDF' },
              { step: '2', text: 'Click any word to start reading' },
              { step: '3', text: 'Press Space to play / pause' },
            ].map((s) => (
              <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {s.step}
                </div>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{s.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Upload Panel */}
        <div style={{ order: isMobile ? 1 : 2, width: '100%' }}>
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleClick}
            style={{
              width: '100%',
              padding: isMobile ? '40px 24px' : '56px 40px',
              borderRadius: '24px',
              // Glassmorphism
              background: isDragging ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
              textAlign: 'center',
              transform: isDragging ? 'scale(1.01)' : 'scale(1)',
              animation: 'glass-enter 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                backgroundColor: isDragging ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: isDragging ? 'white' : 'var(--text-muted)',
                transition: 'all 0.25s ease',
              }}
            >
              {isDragging ? <FileText size={24} /> : <Upload size={24} />}
            </div>

            <h2 style={{
              fontSize: isMobile ? '18px' : '20px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '8px',
              letterSpacing: '-0.02em',
            }}>
              {isDragging ? 'Drop to open' : 'Choose PDF'}
            </h2>

            <p style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              marginBottom: '20px',
              lineHeight: '1.5',
            }}>
              {isDragging
                ? 'Release to start loading…'
                : isMobile
                  ? 'Tap to browse files'
                  : 'Drag & drop here, or click to browse'}
            </p>

            {!isDragging && (
              <div className="btn-gradient" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 24px',
                height: '44px',
                fontSize: '14px',
              }}>
                <Upload size={16} />
                <span>Choose PDF</span>
              </div>
            )}

            {uploadError && (
              <div style={{
                marginTop: '12px',
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(220, 38, 38, 0.08)',
                border: '1px solid rgba(220, 38, 38, 0.2)',
                color: 'var(--error)',
                fontSize: '13px',
                fontWeight: 500,
                lineHeight: '1.4',
              }}>
                ⚠️ {uploadError}
              </div>
            )}

            <p style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginTop: '16px',
              opacity: 0.7,
            }}>
              Text-based PDFs work best · Max 100 MB
            </p>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" onChange={handleInputChange} style={{ display: 'none' }} />
    </SpotlightContainer>
  );
}