import type { ReactNode } from 'react';

/**
 * Eyebrow + title + subtitle group, centered by default. Wraps the
 * three fragments in a `<div class="section-head">` so the global
 * stagger reveal animation in globals.css fires on scroll-in
 * (eyebrow → title → subtitle, ~110ms apart).
 *
 * Use `<SectionHeader eyebrow="..." title="..." subtitle="..." />`
 * at the top of any section. Title can include JSX (for the inline
 * <span class="serif-em"> italic accents).
 */
interface Props {
    eyebrow?: string;
    title: ReactNode;
    subtitle?: ReactNode;
    align?: 'center' | 'left';
    className?: string;
}

export default function SectionHeader({
    eyebrow,
    title,
    subtitle,
    align = 'center',
    className = '',
}: Props) {
    const alignmentClass = align === 'left' ? '' : 'section-head';
    return (
        <div className={`${alignmentClass} ${className}`.trim()}>
            {eyebrow && <div className="section-eyebrow">{eyebrow}</div>}
            <h2 className="display section-title">{title}</h2>
            {subtitle && <p className="section-sub">{subtitle}</p>}
        </div>
    );
}
