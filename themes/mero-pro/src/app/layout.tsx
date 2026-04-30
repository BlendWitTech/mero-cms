import type { Metadata } from 'next';
import { Bricolage_Grotesque, Inter, Instrument_Serif } from 'next/font/google';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import EditorBridge from '@/components/EditorBridge';
import { CapabilitiesProvider } from '@/components/CapabilitiesProvider';
import { getCapabilities, getSiteData, getActiveThemeConfig, type SiteDataSettings } from '@/lib/api';
import './globals.css';
// Per-design stylesheets — Phase 7 (#117). Each design's CSS is scoped
// under [data-design="<key>"] so all three load safely; the body-level
// `data-design` attribute decides which one's variables actually apply.
import '@/designs/blendwit-tech/styles.css';
import '@/designs/vivid/styles.css';

/**
 * Type pairing — the three families used across every page:
 *   1. Inter (body) — neutral sans for paragraphs and UI.
 *   2. Bricolage Grotesque (display) — chunky 800-weight for headlines.
 *   3. Instrument Serif italic — accent words inside display headings
 *      (`<span class="serif-em">…</span>`) for the linktr.ee feel.
 *
 * These ship bundled with the theme (so the design holds even when
 * the backend is offline). The CMS branding settings can override the
 * runtime stack by writing to --font-body / --font-display via the
 * style block emitted in <RootLayout> below.
 */
const inter = Inter({
    subsets: ['latin'],
    variable: '--font-body',
    display: 'swap',
});

const display = Bricolage_Grotesque({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    variable: '--font-display',
    display: 'swap',
});

const serifEm = Instrument_Serif({
    subsets: ['latin'],
    weight: '400',
    style: 'italic',
    variable: '--font-serif',
    display: 'swap',
});

/**
 * Generate metadata from CMS settings (with theme defaults as fallback).
 * Runs server-side per request — Next caches the upstream fetch so the
 * cost is one round-trip per ISR window.
 */
export async function generateMetadata(): Promise<Metadata> {
    const siteData = await getSiteData();
    const s = siteData?.settings;
    const title = s?.siteTitle?.trim() || 'Mero CMS — Where motion meets meaning';
    const tagline = s?.tagline?.trim() || 'The motion-first content platform.';
    const description = s?.metaDescription?.trim() || tagline;
    const favicon = s?.faviconUrl || '/emblem.svg';

    return {
        title: { default: title, template: `%s · ${title}` },
        description,
        icons: { icon: favicon },
        openGraph: { title, description, type: 'website' },
    };
}

/**
 * Build the CSS variable overrides string from CMS branding settings.
 * Only writes a property if the setting is present — falls through to
 * the hardcoded defaults in globals.css otherwise. Order matches the
 * 16-key contract declared in theme.json's `brandingFields` block.
 */
function buildBrandingCss(s: SiteDataSettings | undefined | null): string {
    if (!s) return '';
    const v: string[] = [];
    // Color tokens
    if (s.primaryColor)    v.push(`--brand: ${s.primaryColor};`);
    if (s.secondaryColor)  v.push(`--navy: ${s.secondaryColor};`);
    if (s.accentColor)     v.push(`--paper: ${s.accentColor};`);
    if (s.textColor)       v.push(`--ink: ${s.textColor};`);
    if (s.headingColor)    v.push(`--ink-2: ${s.headingColor};`);
    if (s.linkColor)       v.push(`--link: ${s.linkColor};`);
    if (s.mutedTextColor)  v.push(`--ink-3: ${s.mutedTextColor};`);
    // Typography — fonts override the next/font CSS variables.
    if (s.headingFont)     v.push(`--font-display: '${s.headingFont}', system-ui, sans-serif;`);
    if (s.bodyFont)        v.push(`--font-body: '${s.bodyFont}', system-ui, sans-serif;`);
    if (s.baseFontSize)    v.push(`--base-fs: ${s.baseFontSize};`);
    if (s.headingWeight)   v.push(`--hw: ${s.headingWeight};`);
    if (s.bodyWeight)      v.push(`--bw: ${s.bodyWeight};`);
    // Layout tokens
    if (s.borderRadius)    v.push(`--r-md: ${s.borderRadius};`);
    if (s.layoutDensity) {
        // Map named density values to spacing scale; fall through if a
        // raw px/rem value is provided.
        const densityMap: Record<string, string> = {
            compact:     '0.85',
            comfortable: '1',
            spacious:    '1.2',
        };
        const factor = densityMap[s.layoutDensity] ?? s.layoutDensity;
        v.push(`--density: ${factor};`);
    }
    return v.length ? `:root{${v.join('')}}` : '';
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    // Fetch capability map + site data once at the layout level. All
    // components below the provider can read tier-gated flags via
    // useCapabilities() (client) or by importing getCapabilities()
    // directly (server). Backend offline → null, all flags default false.
    const [caps, siteData, themeConfig] = await Promise.all([
        getCapabilities(),
        getSiteData(),
        getActiveThemeConfig(),
    ]);

    const brandingCss = buildBrandingCss(siteData?.settings);
    // Phase 7 design dispatch: backend's mergeActiveDesign returns the
    // resolved active design key; fall back to theme.json's default if
    // the backend is offline so the page still renders.
    const activeDesign =
        themeConfig?.activeDesign ||
        themeConfig?.bundle?.activeDesign ||
        'marketing';

    return (
        <html
            lang="en"
            className={`${inter.variable} ${display.variable} ${serifEm.variable}`}
        >
            <body data-design={activeDesign}>
                {/* Runtime CSS variable overrides from CMS branding settings.
                    Next.js hoists <style> tags so DOM placement doesn't
                    matter for the cascade — keeping it here avoids the
                    App Router's hydration warning about whitespace text
                    nodes inside <head>. The id makes it greppable for
                    visual-editor live updates. */}
                {brandingCss && (
                    <style
                        id="mero-branding"
                        dangerouslySetInnerHTML={{ __html: brandingCss }}
                    />
                )}
                <CapabilitiesProvider capabilities={caps}>
                    <EditorBridge />
                    <Navigation />
                    {children}
                    <Footer />
                </CapabilitiesProvider>
            </body>
        </html>
    );
}
