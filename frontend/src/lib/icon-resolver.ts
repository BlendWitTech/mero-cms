/**
 * icon-resolver — look up a Lucide icon component by string name.
 *
 * Themes declare their widget icons in `theme.json`'s `widgetCatalog`
 * as PascalCase Lucide names (e.g. `"Sparkles"`, `"Compass"`). The
 * admin used to hardcode a small allowlist of those names — every
 * theme that wanted a different icon required an admin code change.
 *
 * This resolver removes the hardcoding by deferring to Lucide's full
 * export at runtime. Any icon Lucide ships is fair game; unknown names
 * fall back to a neutral square so the editor never crashes.
 *
 * Usage:
 *
 *   import { iconFor } from '@/lib/icon-resolver';
 *
 *   const Icon = iconFor(widget.icon);
 *   <Icon className="h-4 w-4" />
 *
 * The fallback is intentionally light (Square) instead of an alarming
 * error glyph — a missing icon shouldn't make the rest of a polished
 * widget palette look broken.
 */

import * as Lucide from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Resolve an icon by name. Returns the Lucide.Square fallback when the
 * name is empty or doesn't map to an exported component.
 */
export function iconFor(name: string | undefined | null): LucideIcon {
    if (!name) return Lucide.Square;
    const candidate = (Lucide as Record<string, unknown>)[name];
    // Lucide icons are forwardRef components — both function and object
    // shapes should pass. Anything else (a stray number, a sub-namespace)
    // falls back to Square.
    if (typeof candidate === 'function') return candidate as LucideIcon;
    if (candidate && typeof candidate === 'object' && 'render' in (candidate as object)) {
        return candidate as LucideIcon;
    }
    return Lucide.Square;
}

/**
 * Whether a given string is exported as an icon by Lucide. Useful for
 * surfacing "this icon name doesn't exist in Lucide" warnings in the
 * theme manifest editor without making the resolver throw.
 */
export function isKnownIcon(name: string | undefined | null): boolean {
    if (!name) return false;
    const candidate = (Lucide as Record<string, unknown>)[name];
    if (typeof candidate === 'function') return true;
    return !!candidate && typeof candidate === 'object' && 'render' in (candidate as object);
}
