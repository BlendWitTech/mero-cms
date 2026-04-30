import type { Metadata } from 'next';
import AuthForm from '@/components/ui/AuthForm';

export const metadata: Metadata = {
    title: 'Sign in',
    description: 'Sign in to your Mero CMS workspace.',
};

export default function LoginPage() {
    return (
        <main
            style={{
                minHeight: 'calc(100vh - 100px)',
                display: 'grid',
                placeItems: 'center',
                padding: '160px 24px 80px',
                background:
                    'radial-gradient(ellipse 70% 50% at 50% 0%, var(--pastel-pink) 0%, transparent 60%), var(--paper)',
            }}
        >
            <AuthForm mode="login" />
        </main>
    );
}
