/* ========================================
   FREE PDF TTS READER — Footer
   by Analyst Sandeep
   Redesign: Warm Premium Reader
   MOBILE: Simplified single-line
   ======================================== */


interface FooterProps {
  isMobile?: boolean;
}

export default function Footer({ isMobile = false }: FooterProps) {
  // Mobile: simplified single-line footer
  if (isMobile) {
    return (
      <footer
        style={{
          padding: '4px 12px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-secondary)',
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <span style={{ fontSize: '11px' }}>🎧</span>
          <span className="gradient-text" style={{ fontSize: '10px', fontWeight: 700 }}>
            PDF TTS READER
          </span>
          <span style={{ width: '1px', height: '10px', backgroundColor: 'var(--border-color)' }} />
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            by <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Analyst Sandeep</span>
          </span>
        </div>
      </footer>
    );
  }

  // Desktop: full footer with badges and email
  return (
    <footer
      style={{
        padding: '6px 24px',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-secondary)',
        textAlign: 'center',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '12px' }}>🎧</span>
        <span className="gradient-text" style={{ fontSize: '11px', fontWeight: 700 }}>
          PDF TTS READER
        </span>

        <span style={{ width: '1px', height: '12px', backgroundColor: 'var(--border-color)' }} />

        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Built by{' '}
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Analyst Sandeep</span>
        </span>

        <span style={{ width: '1px', height: '12px', backgroundColor: 'var(--border-color)' }} />

        {['Free', 'Local', 'Private', 'Chrome / Edge'].map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: '9px',
              fontWeight: 500,
              color: 'var(--text-muted)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-tertiary)',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </footer>
  );
}