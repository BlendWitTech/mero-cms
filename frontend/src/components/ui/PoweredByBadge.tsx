'use client';

import { useCapabilities } from '@/context/CapabilitiesContext';
import { useSettings } from '@/context/SettingsContext';

interface PoweredByBadgeProps {
    /** Optional override tone — default mutes into slate; "inverted" brightens for dark hero backgrounds. */
    variant?: 'default' | 'inverted';
    className?: string;
}

/**
 * Renders a discreet "Powered by Mero CMS" attribution line.
 *
 * Suppressed when the active plan has `hasWhiteLabel === true` AND the user
 * has flipped `whitelabel_hide_powered_by` in Settings → White Label. Also
 * substitutes a custom footer string (`whitelabel_footer_text`) when provided,
 * so customers on Enterprise/Custom can own the attribution entirely.
 *
 * Used in the admin shell footer, the login/register/reset-password screens,
 * and the setup wizard. Lower-tier plans always see the Mero badge — that's
 * how we keep the upgrade path visible without being pushy in-app.
 */
export default function PoweredByBadge({ variant = 'default', className = '' }: PoweredByBadgeProps) {
    const { limits } = useCapabilities();
    const { settings } = useSettings();

    const canHide = limits?.hasWhiteLabel === true;
    const hidden = canHide && settings?.whitelabel_hide_powered_by === 'true';
    const customText = (settings?.whitelabel_footer_text || '').trim();

    // If the customer set a custom footer string AND they're allowed to
    // white-label, show that instead of the Mero badge entirely.
    if (canHide && customText) {
        return (
            <p
                className={
                    (variant === 'inverted'
                        ? 'text-white/60'
                        : 'text-slate-400 dark:text-slate-500') +
                    ' text-[11px] font-medium ' +
                    className
                }
            >
                {customText}
            </p>
        );
    }

    if (hidden) return null;

    const textTone =
        variant === 'inverted' ? 'text-white/60' : 'text-slate-400 dark:text-slate-500';
    const linkTone =
        variant === 'inverted'
            ? 'text-white/80 hover:text-white'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300';

    return (
        <p className={`${textTone} text-[11px] font-medium ${className}`}>
            Powered by{' '}
            <a
                href="https://mero.cms"
                target="_blank"
                rel="noopener noreferrer"
                className={`${linkTone} font-bold transition-colors`}
            >
                Mero CMS
            </a>
        </p>
    );
}
