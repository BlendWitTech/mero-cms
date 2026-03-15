'use client';

import { useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3000';

export default function NoThemeActive() {
  // Auto-reload when a theme becomes active
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/public/site-data`);
        if (res.ok) {
          const data = await res.json();
          if (data?.settings?.activeTheme) {
            window.location.reload();
          }
        }
      } catch {
        // Backend unreachable, keep waiting
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f172a',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '1.5rem',
        padding: '3rem 2.5rem',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
      }}>
        {/* Icon */}
        <div style={{
          width: '72px',
          height: '72px',
          background: '#0f172a',
          border: '2px solid #334155',
          borderRadius: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.75rem',
          fontSize: '2rem',
        }}>
          🎨
        </div>

        {/* Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: '#0f172a',
          border: '1px solid #334155',
          color: '#64748b',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          padding: '0.3rem 0.8rem',
          borderRadius: '100px',
          marginBottom: '1.25rem',
        }}>
          <span style={{
            display: 'inline-block',
            width: '7px',
            height: '7px',
            background: '#f59e0b',
            borderRadius: '50%',
            animation: 'pulse 2s infinite',
          }} />
          No Theme Active
        </div>

        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          color: '#f1f5f9',
          marginBottom: '0.75rem',
          letterSpacing: '-0.025em',
        }}>
          Activate a Theme to Get Started
        </h1>

        <p style={{
          color: '#94a3b8',
          lineHeight: 1.7,
          fontSize: '0.95rem',
          marginBottom: '2rem',
        }}>
          Your public website is waiting for a theme. Head to the admin panel,
          go to <strong style={{ color: '#cbd5e1' }}>Appearance → Themes</strong>, and
          activate a theme to see your site come to life here.
        </p>

        <a
          href={`${ADMIN_URL}/dashboard/themes`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#3b82f6',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.875rem',
            padding: '0.75rem 1.75rem',
            borderRadius: '0.75rem',
            textDecoration: 'none',
            letterSpacing: '0.01em',
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
          </svg>
          Go to Theme Management
        </a>

        <p style={{ marginTop: '1.5rem', fontSize: '0.78rem', color: '#475569' }}>
          This page reloads automatically when a theme is activated.
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
