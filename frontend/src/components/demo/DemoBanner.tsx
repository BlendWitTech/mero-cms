'use client';

import { useEffect, useState } from 'react';
import { BeakerIcon, ClockIcon } from '@heroicons/react/24/outline';

function useCountdown(targetIso: string | null) {
    const [seconds, setSeconds] = useState<number | null>(null);

    useEffect(() => {
        if (!targetIso) return;
        const tick = () => {
            const diff = Math.max(0, Math.floor((new Date(targetIso).getTime() - Date.now()) / 1000));
            setSeconds(diff);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [targetIso]);

    if (seconds === null) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function DemoBanner() {
    const [nextReset, setNextReset] = useState<string | null>(null);
    const countdown = useCountdown(nextReset);

    useEffect(() => {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        fetch(`${apiBase}/public/site-data`)
            .then(r => r.json())
            .then(d => { if (d.demoNextReset) setNextReset(d.demoNextReset); })
            .catch(() => { });
    }, []);

    return (
        <div className="w-full bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-3 text-xs font-bold z-50 shrink-0">
            <BeakerIcon className="h-4 w-4 shrink-0" />
            <span>Demo environment — changes are reset every 2 hours. Explore freely!</span>
            {countdown && (
                <span className="flex items-center gap-1 bg-amber-600/50 rounded-lg px-2 py-0.5 font-mono tracking-wider">
                    <ClockIcon className="h-3 w-3" />
                    {countdown}
                </span>
            )}
        </div>
    );
}
