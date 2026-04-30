'use client';

import { useEffect } from 'react';

const SPLASH_CSS = `
  @keyframes _sp { to { transform: rotate(360deg); } }
  @keyframes _pp { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.08);opacity:.85} }
  #app-splash { pointer-events:none; }
  #app-splash .sp-logo { animation: _pp 2s ease-in-out infinite; }
  #app-splash .sp-ring { animation: _sp 1.1s linear infinite; }
`;

export default function AppSplash() {
  useEffect(() => {
    // Inject splash into DOM — runs only on client, so no SSR/hydration conflict
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const bg = isDark ? '#020617' : '#ffffff';

    const splash = document.createElement('div');
    splash.id = 'app-splash';
    Object.assign(splash.style, {
      position: 'fixed', inset: '0', zIndex: '99999',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px',
      background: bg,
    });

    splash.innerHTML = `
      <style>${SPLASH_CSS}</style>
      <div class="sp-logo" style="width:64px;height:64px;border-radius:18px;background:#DC1F2E;display:flex;align-items:center;justify-content:center;box-shadow:0 20px 60px rgba(220,31,46,0.35)">
        <span style="color:#fff;font-weight:900;font-size:28px;font-family:system-ui,sans-serif;letter-spacing:-1px">M</span>
      </div>
      <div class="sp-ring" style="width:36px;height:36px;border-radius:50%;border:3px solid rgba(220,31,46,0.15);border-top-color:#DC1F2E"></div>
    `;

    document.body.prepend(splash);

    // Fade out and remove
    const fadeOut = () => {
      splash.style.transition = 'opacity 0.4s ease';
      splash.style.opacity = '0';
      setTimeout(() => splash.remove(), 420);
    };

    // Remove after page is interactive or after a max timeout
    if (document.readyState === 'complete') {
      fadeOut();
    } else {
      window.addEventListener('load', fadeOut, { once: true });
      // Safety fallback — never show more than 4s
      setTimeout(fadeOut, 4000);
    }

    return () => splash.remove();
  }, []);

  return null;
}
