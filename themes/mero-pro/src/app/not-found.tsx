import Link from 'next/link';
import Button from '@/components/ui/Button';

export const metadata = {
    title: 'Not found',
};

/**
 * 404 page. Reuses the brand's mesh-gradient backdrop so the not-found
 * screen still feels on-brand instead of a stark default page.
 */
export default function NotFound() {
    return (
        <main
            style={{
                minHeight: 'calc(100vh - 100px)',
                display: 'grid',
                placeItems: 'center',
                padding: '160px 24px 80px',
                background:
                    'radial-gradient(ellipse 70% 50% at 50% 0%, var(--pastel-pink) 0%, transparent 60%), var(--paper)',
                textAlign: 'center',
            }}
        >
            <div style={{ maxWidth: 520 }}>
                <p className="section-eyebrow" style={{ marginBottom: 12 }}>
                    404 · Page not found
                </p>
                <h1 className="display" style={{ fontSize: 'clamp(40px, 6vw, 76px)', marginBottom: 16 }}>
                    Wrong door,{' '}
                    <span className="serif-em" style={{ color: 'var(--brand)' }}>
                        right vibe.
                    </span>
                </h1>
                <p style={{ fontSize: 17, color: 'var(--ink-3)', lineHeight: 1.6, marginBottom: 32 }}>
                    The page you’re looking for doesn’t exist anymore — or it was never here in the first place. Try the links below.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button href="/" variant="brand">
                        Back to home
                    </Button>
                    <Button href="/contact" variant="light">
                        Tell us what you were looking for
                    </Button>
                </div>
            </div>
        </main>
    );
}
