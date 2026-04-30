import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Pill-shaped button component used everywhere a CTA appears.
 * Maps the .btn / .btn-* utility classes from globals.css into a
 * typed React API. Renders an <a> when an href is provided
 * (Next/Link for internal routes, plain <a> for external), or a
 * <button> otherwise.
 */
export type ButtonVariant = 'primary' | 'brand' | 'ghost' | 'light';
export type ButtonSize = 'md' | 'lg';

interface ButtonProps {
    children: ReactNode;
    href?: string;
    onClick?: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    className?: string;
    /** Custom inline style — used for dark-overlay variant in the
        final-CTA where the .btn-light needs a translucent bg. */
    style?: React.CSSProperties;
    type?: 'button' | 'submit' | 'reset';
}

const variantClass: Record<ButtonVariant, string> = {
    primary: 'btn-primary',
    brand: 'btn-brand',
    ghost: 'btn-ghost',
    light: 'btn-light',
};

export default function Button({
    children,
    href,
    onClick,
    variant = 'primary',
    size = 'md',
    className = '',
    style,
    type = 'button',
}: ButtonProps) {
    const classes = `btn ${variantClass[variant]} ${size === 'lg' ? 'btn-lg' : ''} ${className}`.trim();

    if (href) {
        const isExternal = /^https?:\/\//.test(href);
        if (isExternal) {
            return (
                <a href={href} className={classes} style={style} target="_blank" rel="noreferrer">
                    {children}
                </a>
            );
        }
        return (
            <Link href={href} className={classes} style={style}>
                {children}
            </Link>
        );
    }

    return (
        <button type={type} onClick={onClick} className={classes} style={style}>
            {children}
        </button>
    );
}

/** Trailing arrow glyph used in primary CTAs ("Start free →"). */
export function ArrowIcon() {
    return <span aria-hidden="true">→</span>;
}
