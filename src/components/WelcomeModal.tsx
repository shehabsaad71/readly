/* ========================================
   FREE PDF TTS READER — Welcome Modal
   by Analyst Sandeep
   Editorial Minimal Reader
   ======================================== */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  MousePointer,
  Keyboard,
  BookOpen,
  Wifi,
  Volume2,
  FileText,
  Shield,
  Lightbulb,
  ChevronDown,
} from 'lucide-react';

const STORAGE_KEY = 'pdf-tts-welcome-dismissed';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function shouldShowWelcome(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'true';
  } catch {
    return true;
  }
}

/* Solid surface tokens (no glassmorphism) */
const surface = {
  panel: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-lg)',
  } as React.CSSProperties,
  sectionClosed: {
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'none',
  } as React.CSSProperties,
  sectionOpen: {
    background: 'var(--accent-soft)',
    border: '1px solid var(--accent-medium)',
    boxShadow: 'none',
  } as React.CSSProperties,
  chrome: {
    background: 'transparent',
    borderColor: 'var(--border-subtle)',
  } as React.CSSProperties,
};

function Section({
  id,
  icon,
  title,
  children,
  openSectionId,
  previousSectionId,
  onToggle,
  scrollContainerRef,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  openSectionId: string | null;
  previousSectionId: string | null;
  onToggle: (id: string) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const headingRef = useRef<HTMLButtonElement>(null);
  const isOpen = openSectionId === id;

  useEffect(() => {
    if (!isOpen || !headingRef.current || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const heading = headingRef.current;

    const hadPreviousSection = previousSectionId !== null && previousSectionId !== id;
    const delay = hadPreviousSection ? 350 : 50;

    const timer = setTimeout(() => {
      const containerRect = container.getBoundingClientRect();
      const headingRect = heading.getBoundingClientRect();
      const scrollTop = container.scrollTop;
      const headingTopInContainer = headingRect.top - containerRect.top + scrollTop;
      const targetScroll = headingTopInContainer - 20;

      requestAnimationFrame(() => {
        container.scrollTo({
          top: Math.max(0, targetScroll),
          behavior: 'smooth',
        });
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [isOpen, previousSectionId, scrollContainerRef, id]);

  return (
    <div
      style={{
        ...(isOpen ? surface.sectionOpen : surface.sectionClosed),
        borderRadius: '14px',
        overflow: 'hidden',
        marginBottom: '8px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <button
        ref={headingRef}
        onClick={() => onToggle(id)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 16px',
          textAlign: 'left',
          color: 'var(--text-primary)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          fontFamily: 'var(--font-ui)',
        }}
      >
        <span
          style={{
            flexShrink: 0,
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isOpen
              ? 'var(--accent)'
              : 'var(--bg-sunken)',
            color: isOpen ? 'white' : 'var(--text-secondary)',
            transition: 'all 0.3s ease',
            transform: isOpen ? 'scale(1.05)' : 'scale(1)',
            boxShadow: isOpen ? '0 4px 12px var(--accent-soft)' : 'none',
          }}
        >
          {icon}
        </span>
        <span
          style={{
            flex: 1,
            fontWeight: 600,
            color: isOpen ? 'var(--accent)' : 'var(--text-primary)',
            transition: 'color 0.3s ease',
          }}
        >
          {title}
        </span>
        <span
          style={{
            color: isOpen ? 'var(--accent)' : 'var(--text-muted)',
            transition: 'transform 0.3s ease, color 0.3s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronDown size={16} />
        </span>
      </button>

      <div
        style={{
          maxHeight: isOpen ? '2000px' : '0px',
          opacity: isOpen ? 1 : 0,
          overflow: 'hidden',
          transition: isOpen
            ? 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease 0.05s'
            : 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease',
        }}
      >
        <div
          style={{
            padding: '0 16px 16px 16px',
            fontSize: '14px',
            lineHeight: '1.7',
            color: 'var(--text-secondary)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
      <span
        style={{
          flexShrink: 0,
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 700,
          background: 'var(--accent)',
          color: 'white',
        }}
      >
        {number}
      </span>
      <div>
        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
          {title}
        </div>
        <div style={{ marginTop: '4px', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Shortcut({ keys, action }: { keys: string; action: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
      <kbd
        style={{
          padding: '4px 10px',
          borderRadius: '8px',
          fontSize: '12px',
          fontFamily: 'monospace',
          fontWeight: 600,
          backgroundColor: 'var(--bg-sunken)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          boxShadow: '0 1px 0 var(--border-color)',
        }}
      >
        {keys}
      </kbd>
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        {action}
      </span>
    </div>
  );
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  const [previousSectionId, setPreviousSectionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setOpenSectionId(null);
      setPreviousSectionId(null);
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    }
  }, [isOpen]);

  const handleToggle = useCallback((id: string) => {
    setOpenSectionId((prev) => {
      setPreviousSectionId(prev);
      return prev === id ? null : id;
    });
  }, []);

  if (!isOpen) return null;

  const isMobileView = window.innerWidth < 768;

  const handleClose = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch {
        // Ignore
      }
    }
    onClose();
  };

  return (
    /* ── Overlay: dark scrim + SINGLE backdrop blur source ── */
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: isMobileView ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: isMobileView ? '0' : '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Slightly darker for better contrast
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'overlay-in 0.25s ease forwards',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {/* ── Glass Panel ── */}
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: isMobileView ? '100%' : '640px',
          maxHeight: isMobileView ? '95vh' : '90vh',
          borderRadius: isMobileView ? '20px 20px 0 0' : '24px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
          animation: isMobileView
            ? 'slide-in-up-modal 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            : 'modal-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <style>{`
          @keyframes slide-in-up-modal {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}</style>
        {/* ── Header ── */}
        <div
          style={{
            position: 'relative',
            padding: isMobileView ? '20px 16px 14px 16px' : '28px 24px 18px 24px',
            textAlign: 'center',
            borderBottom: `1px solid ${surface.chrome.borderColor}`,
            background: surface.chrome.background,
            flexShrink: 0,
          }}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <X size={14} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobileView ? '8px' : '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: isMobileView ? '24px' : '30px' }}>🎧</span>
            <h2
              className="gradient-text"
              style={{
                fontSize: isMobileView ? '18px' : '22px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                fontFamily: 'var(--font-ui)',
              }}
            >
              FREE PDF TTS READER
            </h2>
          </div>

          <p style={{ fontSize: '13px', marginTop: '10px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Your free, private PDF reader with text-to-speech.
            Everything runs locally — no data leaves your computer.
          </p>

        </div>

        {/* ── Scrollable Content ── */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            scrollBehavior: 'smooth',
          }}
        >
          <Section id="how-to-use" icon={<BookOpen size={16} />} title="How to Use" openSectionId={openSectionId} previousSectionId={previousSectionId} onToggle={handleToggle} scrollContainerRef={scrollRef}>
            <div style={{ marginTop: '8px' }}>
              <Step number={1} title="Upload Your PDF">
                Drag and drop a PDF file onto the upload area, or click the
                <strong> &quot;Choose PDF&quot;</strong> button to browse your files.
                The entire PDF will load with all pages visible.
              </Step>
              <Step number={2} title="Choose a Voice">
                Open the <strong>Voice Panel</strong> on the right side.
                Search by typing language, country, or name
                (e.g., &quot;US&quot;, &quot;English&quot;, &quot;Indian&quot;, &quot;Female&quot;).
                Click the 🔊 icon to preview any voice, then click the
                voice name to select it.
              </Step>
              <Step number={3} title="Start Reading">
                <strong>Single-click</strong> any word in the PDF — reading
                begins from that exact word. The current word will glow
                with a highlight as it is read aloud.
              </Step>
              <Step number={4} title="Control Playback">
                Use the <strong>Star Button</strong> to Play, Pause, or
                Resume. Press <strong>Space bar</strong> to pause/resume, or
                <strong> Esc</strong> to stop completely.
                Adjust reading speed with the speed slider
                (0.5x slow to 1x normal to 3x fast).
              </Step>
              <Step number={5} title="Get Word Definitions">
                <strong>Right-click</strong> any word to see its meaning.
                Definitions come from a free online dictionary.
                Internet connection is required for this feature.
              </Step>
              <Step number={6} title="Navigate Your PDF">
                Use <strong>+ / -</strong> buttons to zoom, or
                <strong> Ctrl + scroll</strong> wheel.
                Type a page number to jump directly.
                Scroll freely while reading — the app will not force you back.
                Click <strong>&quot;Go to Current Word&quot;</strong> to jump back
                to the active reading position.
              </Step>
            </div>
          </Section>

          <Section id="mouse" icon={<MousePointer size={16} />} title="Mouse Controls" openSectionId={openSectionId} previousSectionId={previousSectionId} onToggle={handleToggle} scrollContainerRef={scrollRef}>
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontWeight: 600, fontSize: '12px', padding: '4px 10px', borderRadius: '6px', backgroundColor: 'var(--accent-soft)', color: 'var(--accent-start)' }}>Left Click</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Start reading from that word</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontWeight: 600, fontSize: '12px', padding: '4px 10px', borderRadius: '6px', backgroundColor: 'var(--accent-soft)', color: 'var(--accent-start)' }}>Double Click</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Instantly pause reading</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontWeight: 600, fontSize: '12px', padding: '4px 10px', borderRadius: '6px', backgroundColor: 'var(--accent-soft)', color: 'var(--accent-start)' }}>Right Click</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Show word definition</span>
              </div>
            </div>
          </Section>

          <Section id="keyboard" icon={<Keyboard size={16} />} title="Keyboard Shortcuts" openSectionId={openSectionId} previousSectionId={previousSectionId} onToggle={handleToggle} scrollContainerRef={scrollRef}>
            <div style={{ marginTop: '8px' }}>
              <Shortcut keys="Space" action="Pause / Resume" />
              <Shortcut keys="Escape" action="Stop and clear highlights" />
              <Shortcut keys="?" action="Show shortcuts panel" />
              <Shortcut keys="Ctrl + =" action="Zoom in" />
              <Shortcut keys="Ctrl + -" action="Zoom out" />
              <Shortcut keys="Ctrl + 0" action="Fit to width" />
            </div>
          </Section>

          <Section id="internet" icon={<Wifi size={16} />} title="Internet Connection" openSectionId={openSectionId} previousSectionId={previousSectionId} onToggle={handleToggle} scrollContainerRef={scrollRef}>
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>🌐 <strong>Word definitions</strong> require an active internet connection. If definitions do not appear, please check your internet and try again.</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>🔊 <strong>Reading aloud works 100% offline</strong> — no internet needed for text-to-speech.</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>🔒 No data is sent to any server except dictionary lookups (just the single word being looked up).</p>
            </div>
          </Section>

          <Section id="voices" icon={<Volume2 size={16} />} title="Voice Availability" openSectionId={openSectionId} previousSectionId={previousSectionId} onToggle={handleToggle} scrollContainerRef={scrollRef}>
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Available voices depend on your <strong>operating system</strong> and <strong>browser</strong>. For the best experience, use <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong> on Windows.</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Voice gender labels are <strong>best-effort estimates</strong> based on voice names and may not always be accurate.</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>You can <strong>preview any voice</strong> before selecting it by clicking the speaker icon next to each voice.</p>
            </div>
          </Section>

          <Section id="pdf" icon={<FileText size={16} />} title="PDF Compatibility" openSectionId={openSectionId} previousSectionId={previousSectionId} onToggle={handleToggle} scrollContainerRef={scrollRef}>
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>✅ Works best with <strong>text-based PDFs</strong> (most PDFs).</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>⚠️ <strong>Scanned PDFs</strong> (image-only) cannot be read aloud because they contain no extractable text.</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>⚠️ Complex layouts like <strong>multi-column documents</strong> or <strong>tables</strong> may have slightly different reading order.</p>
            </div>
          </Section>

          <Section id="privacy" icon={<Shield size={16} />} title="Privacy and Security" openSectionId={openSectionId} previousSectionId={previousSectionId} onToggle={handleToggle} scrollContainerRef={scrollRef}>
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>🔒 Your PDF <strong>never leaves your computer</strong>.</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>📡 No files are uploaded to any server.</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>🚫 No login, signup, tracking, or analytics.</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>🍪 No cookies — only localStorage for your preferences.</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>🌐 The only network request is for word definitions (optional).</p>
            </div>
          </Section>

          <Section id="tips" icon={<Lightbulb size={16} />} title="Tips for Best Experience" openSectionId={openSectionId} previousSectionId={previousSectionId} onToggle={handleToggle} scrollContainerRef={scrollRef}>
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>💻 Use <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong> for the most voices and best speech quality.</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>🎙️ Try different voices — some sound much more natural than others.</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>🏎️ Start with <strong>1x speed</strong>, then adjust to your liking.</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>⏸️ <strong>Double-click</strong> any word to instantly pause.</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>📍 Use the <strong>&quot;Go to Current Word&quot;</strong> button if you lose your place after scrolling.</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>📝 <strong>Select text</strong> and click &quot;Read Selection&quot; to read only a specific portion.</p>
            </div>
          </Section>
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            padding: '20px 24px',
            borderTop: `1px solid ${surface.chrome.borderColor}`,
            background: surface.chrome.background,
            flexShrink: 0,
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              cursor: 'pointer',
              userSelect: 'none',
              color: 'var(--text-secondary)',
              fontSize: '14px',
            }}
          >
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent-start)' }}
            />
            <span>Do not show this again</span>
          </label>

          <button
            onClick={handleClose}
            className="btn-gradient"
            style={{
              width: '100%',
              height: '48px',
              fontSize: '16px',
              borderRadius: '14px',
              gap: '8px',
            }}
          >
            <span>Get Started</span>
          </button>


        </div>
      </div>
    </div>
  );
}