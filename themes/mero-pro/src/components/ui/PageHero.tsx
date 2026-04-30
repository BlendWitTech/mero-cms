import type { ReactNode } from 'react';
import EmblemWatermark from '@/components/ui/EmblemWatermark';

/**
 * Slim hero used at the top of every non-home page. Lighter than the
 * full home Hero — just eyebrow + h1 + subtitle on a soft pastel mesh
 * gradient with a faint emblem watermark at top-right. Optional
 * `actions` slot for CTAs.
 */
interface Props {
    eyebrow?: string;
    title: ReactNode;
    subtitle?: ReactNode;
    actions?: ReactNode;
}

export default function PageHero({ eyebrow, title, subtitle, actions }: Props) {
    return (
        <section
            className="has-watermark"
            style={{
                position: 'relative',
                padding: '160px 0 80px',
                background:
                    'radial-gradient(ellipse 70% 50% at 50% 0%, var(--pastel-pink) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 100% 30%, var(--pastel-butter) 0%, transparent 50%), var(--paper)',
            }}
        >
            <EmblemWatermark position="tr" />
            <div className="container">
                <div className="section-head" style={{ marginBottom: 0 }}>
                    {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
                    <h1 className="display section-title" style={{ fontSize: 'clamp(40px, 6vw, 76px)' }}>
                        {title}
                    </h1>
                    {subtitle && <p className="section-sub">{subtitle}</p>}
                    {actions && (
                        <div
                            style={{
                                marginTop: 32,
                                display: 'flex',
                                gap: 10,
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                            }}
                        >
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
