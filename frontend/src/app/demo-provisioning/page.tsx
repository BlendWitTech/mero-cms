'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/api';
import { setAuthToken } from '@/lib/auth';
import DeployingWorkspace from '@/components/demo/DeployingWorkspace';
import { useNotification } from '@/context/NotificationContext';

const STATUS_MAP: Record<string, { progress: number; message: string; level: 'CORE' | 'INFRA' | 'DB' | 'SEED' }> = {
    'PROVISIONING': { progress: 10, message: 'Attaching hypervisor node...', level: 'INFRA' },
    'INFRA_READY': { progress: 25, message: 'Crafting PostgreSQL container...', level: 'DB' },
    'MIGRATING': { progress: 50, message: 'Harmonizing system schema...', level: 'DB' },
    'SEEDING': { progress: 75, message: 'Synthesizing demo content assets...', level: 'SEED' },
    'READY': { progress: 100, message: 'Demo live. Synchronizing access...', level: 'CORE' },
    'FAILED': { progress: 100, message: 'Synthesis failure encountered.', level: 'CORE' },
};

function ProvisioningContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageId = searchParams.get('packageId') || 'basic';
  const { showToast } = useNotification();
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('PROVISIONING');
  const [progress, setProgress] = useState(5);
  const [logs, setLogs] = useState<{ level: string; message: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addLog = useCallback((level: string, message: string) => {
    setLogs(prev => {
        // Only add if last message is different
        if (prev.length > 0 && prev[prev.length - 1].message === message) return prev;
        return [...prev, { level, message }];
    });
  }, []);

  // 1. Initial Start Call
  useEffect(() => {
    async function start() {
      try {
        const API_URL = getApiBaseUrl();
        const res = await fetch(`${API_URL}/demo/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packageId }),
        });
        if (!res.ok) throw new Error('Failed to reach provisioning gateway.');
        const data = await res.json();
        setSessionId(data.sessionId);
      } catch (err: any) {
        setError(err.message);
      }
    }
    start();
  }, [packageId]);

  // 2. Polling Logic
  useEffect(() => {
    if (!sessionId || status === 'READY' || status === 'FAILED') return;

    const API_URL = getApiBaseUrl();
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/demo/status/${sessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        
        setStatus(data.status);
        
        const info = STATUS_MAP[data.status];
        if (info) {
          setProgress(info.progress);
          addLog(info.level, info.message);
        }

        if (data.status === 'READY') {
          clearInterval(interval);
          setAuthToken(data.accessToken);
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        }
        
        if (data.status === 'FAILED') {
          clearInterval(interval);
          setError('Provisioning engine encountered a terminal error.');
        }
      } catch (e) {
        // Silent retry
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionId, status, router, addLog]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-black text-white mb-2">Synthesis Failed</h1>
        <p className="text-slate-400 max-w-md mb-8">{error}</p>
        <button onClick={() => window.location.reload()} className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold text-sm">
          Re-initialize
        </button>
      </div>
    );
  }

  return <DeployingWorkspace progress={progress} externalLogs={logs} />;
}

export default function DemoProvisioningPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <ProvisioningContent />
    </Suspense>
  );
}
