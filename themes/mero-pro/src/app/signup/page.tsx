import type { Metadata } from 'next';
import AuthForm from '@/components/ui/AuthForm';

export const metadata: Metadata = {
    title: 'Start free',
    description: 'Spin up a free Mero CMS workspace in 90 seconds.',
};

export default function SignupPage() {
    return (
        <main
            style={{
                minHeight: 'calc(100vh - 100px)',
                display: 'grid',
                placeItems: 'center',
                padding: '160px 24px 80px',
                background:
                    'radial-gradient(ellipse 70% 50% at 50% 0%, var(--pastel-butter) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 100% 60%, var(--pastel-coral) 0%, transparent 50%), var(--paper)',
            }}
        >
            <AuthForm mode="signup" />
        </main>
    );
}
