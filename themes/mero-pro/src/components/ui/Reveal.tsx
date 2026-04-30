'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Scroll-reveal observer.
 *
 * The sister CSS in globals.css declares `.reveal*` classes that start
 * hidden (opacity 0 + small transform). Once an element enters the
 * viewport (≥15%), this observer toggles `.in-view` and the CSS
 * transitions handle the reveal. Reveal-once: each element animates
 * the first time it crosses, then stays visible forever.
 *
 * One `<Reveal>` mounts at the page root (in app/page.tsx) and observes
 * every reveal-marked element on the page — single observer, low cost.
 */
export default function Reveal({ children }: { children: ReactNode }) {
    const root = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!root.current) return;

        // Reduced-motion users get the in-view state instantly so the
        // copy is readable; the CSS @media query above also disables
        // any transition animation, so this is purely a safety net.
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const targets = root.current.querySelectorAll<HTMLElement>(
            '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger, .section-head',
        );

        if (reduceMotion || !('IntersectionObserver' in window)) {
            targets.forEach(el => el.classList.add('in-view'));
            return;
        }

        const io = new IntersectionObserver(
            entries => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in-view');
                        io.unobserve(entry.target);
                    }
                }
            },
            { threshold: 0.15, rootMargin: '0px 0px -80px 0px' },
        );

        targets.forEach(el => io.observe(el));

        return () => io.disconnect();
    }, []);

    return <div ref={root}>{children}</div>;
}
