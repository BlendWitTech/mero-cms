'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/** Max time the overlay stays up without finish() firing. Hard failsafe so a
 * missed/aborted navigation never leaves the spinner stuck on screen. */
const MAX_VISIBLE_MS = 4000;

export default function NavigationProgress() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const searchKey = searchParams?.toString() ?? '';
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);
    const [finishing, setFinishing] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const failsafeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prevPathRef = useRef(pathname);
    const prevSearchRef = useRef(searchKey);
    const visibleRef = useRef(false);

    const start = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (tickRef.current) clearInterval(tickRef.current);
        if (failsafeRef.current) clearTimeout(failsafeRef.current);
        setFinishing(false);
        setProgress(10);
        setVisible(true);
        visibleRef.current = true;
        let p = 10;
        tickRef.current = setInterval(() => {
            p = Math.min(p + Math.random() * 8, 85);
            setProgress(p);
        }, 200);
        // Hard failsafe: auto-finish after MAX_VISIBLE_MS even if no route
        // change is observed (same-page clicks, aborted navs, search-param
        // changes that don't round-trip, etc.).
        failsafeRef.current = setTimeout(() => {
            if (visibleRef.current) finish();
        }, MAX_VISIBLE_MS);
    };

    const finish = () => {
        if (tickRef.current) clearInterval(tickRef.current);
        if (failsafeRef.current) clearTimeout(failsafeRef.current);
        if (!visibleRef.current) return;
        setFinishing(true);
        setProgress(100);
        timerRef.current = setTimeout(() => {
            setVisible(false);
            visibleRef.current = false;
            setFinishing(false);
            setProgress(0);
        }, 350);
    };

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest('a');
            if (!target) return;
            const href = target.getAttribute('href');
            if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || target.hasAttribute('download')) return;
            // Skip same-URL navigations — they won't change pathname and the
            // overlay would have no way to auto-finish via the path-change effect.
            try {
                const url = new URL(href, window.location.href);
                if (url.pathname === window.location.pathname && url.search === window.location.search) {
                    return;
                }
            } catch { /* malformed href — ignore, let default handling run */ }
            start();
        };
        const handleNavStart = () => start();
        document.addEventListener('click', handleClick, true);
        window.addEventListener('navigation-start', handleNavStart);
        return () => {
            document.removeEventListener('click', handleClick, true);
            window.removeEventListener('navigation-start', handleNavStart);
        };
    }, []);

    // Finish whenever pathname OR searchParams change — covers tab-style
    // routes that only mutate ?query=.
    useEffect(() => {
        const pathChanged = pathname !== prevPathRef.current;
        const searchChanged = searchKey !== prevSearchRef.current;
        if (pathChanged || searchChanged) {
            prevPathRef.current = pathname;
            prevSearchRef.current = searchKey;
            finish();
        }
    }, [pathname, searchKey]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (tickRef.current) clearInterval(tickRef.current);
            if (failsafeRef.current) clearTimeout(failsafeRef.current);
        };
    }, []);

    if (!visible) return null;

    return (
        <>
            {/* Top progress bar */}
            <div
                className="fixed top-0 left-0 z-[9999] h-[3px] bg-blue-600 transition-all duration-200 ease-out rounded-r-full shadow-sm shadow-blue-600/40"
                style={{ width: `${progress}%` }}
            />

            {/* Overlay with centered spinner — only while loading, fades out on finish */}
            <div
                className={`fixed inset-0 z-[9998] flex items-center justify-center transition-opacity duration-300 ${finishing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                style={{ background: 'rgba(15, 23, 42, 0.35)', backdropFilter: 'blur(2px)' }}
            >
                <div className="flex flex-col items-center gap-4">
                    {/* Spinner ring */}
                    <div className="relative h-12 w-12">
                        <div className="absolute inset-0 rounded-full border-[3px] border-white/10" />
                        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-blue-500 animate-spin" />
                        <div className="absolute inset-[6px] rounded-full bg-blue-600/20 flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                        </div>
                    </div>
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Loading</p>
                </div>
            </div>
        </>
    );
}
