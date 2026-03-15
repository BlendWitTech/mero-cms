'use client';

import { useState, useEffect, useRef } from 'react';

interface Stat { value: string; label: string; }

function AnimatedStat({ value, label, delay }: Stat & { delay: number }) {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const targetNum = parseInt(value.replace(/[^0-9]/g, ''), 10);
  const suffix = value.replace(/[0-9]/g, '');

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.4 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || isNaN(targetNum)) { setCount(targetNum || 0); return; }
    const duration = 1800;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(ease * targetNum));
      if (progress < 1) requestAnimationFrame(animate);
    };
    const timer = setTimeout(() => requestAnimationFrame(animate), delay);
    return () => clearTimeout(timer);
  }, [visible, targetNum, delay]);

  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1, marginBottom: '0.35rem' }}>
        {isNaN(targetNum) ? value : `${count}${suffix}`}
      </div>
      <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
        {label}
      </div>
    </div>
  );
}

export default function AnimatedStatsStrip({ stats }: { stats: Stat[] }) {
  return (
    <section style={{ background: '#CC1414', padding: '4rem 0' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '2rem' }}>
          {stats.map((s, i) => (
            <AnimatedStat key={s.label} value={s.value} label={s.label} delay={i * 120} />
          ))}
        </div>
      </div>
    </section>
  );
}
