/**
 * Theme catalog — keyed by slug. Hardcoded for the gallery page.
 */
export interface ThemeEntry {
    slug: string;
    name: string;
    tagline: string;
    description: string;
    color: string;
    sections: number;
    repo: string;
    features: string[];
    sectionList: { name: string; description: string }[];
    bestFor: string;
}

const THEMES: Record<string, ThemeEntry> = {
    'mero-pro': {
        slug: 'mero-pro',
        name: 'Mero Pro',
        tagline: 'The default — what you&apos;re looking at right now.',
        description:
            'Linktr.ee-inspired marketing theme with Mero brand identity. Hero with character + dashboard mockup, alternating feature blocks, pastel testimonial carousel.',
        color: 'var(--pastel-pink)',
        sections: 9,
        repo: 'github.com/merocms/themes/mero-pro',
        features: [
            'Big chunky display headlines with italic-serif accents (Bricolage Grotesque + Instrument Serif)',
            'Real Mero CMS dashboard mockup baked into the hero + feature rows',
            'Workleap-inspired pastel testimonial carousel',
            'Compact final CTA with team avatar row',
            'Six secondary pages scaffolded (pricing / features / contact / about / blog / careers)',
        ],
        sectionList: [
            { name: 'Hero', description: 'Two-column with character SVG + tilted dashboard backdrop' },
            { name: 'LogoStrip', description: '6 typographic brand marks or logo URLs' },
            { name: 'FeatureBlocks', description: 'Three alternating feature rows; each visual is a Mero CMS dashboard mockup' },
            { name: 'UseCases', description: 'Three role-targeted cards with character illustrations' },
            { name: 'Stats', description: 'Four numbers band with brand-red emphasis' },
            { name: 'PricingTeaser', description: 'Three tier cards with featured middle tier' },
            { name: 'Testimonials', description: 'Pastel carousel with 6 character avatar styles' },
            { name: 'FAQ', description: 'Native <details> accordion with 5 default Q&As' },
            { name: 'FinalCTA', description: 'Compact dark band with emblem + team avatars' },
        ],
        bestFor: 'B2B SaaS, developer tools, creator products. Anything with a strong brand voice that wants the hero to feel "alive."',
    },
    'mero-editorial': {
        slug: 'mero-editorial',
        name: 'Mero Editorial',
        tagline: 'Long-form publication',
        description:
            'For magazines, newsrooms, and content-led brands. Generous typography, full-bleed hero, sidebar table of contents on long posts, optional dark-mode reading.',
        color: 'var(--pastel-butter)',
        sections: 7,
        repo: 'github.com/merocms/themes/mero-editorial',
        features: [
            'Editorial typography (Newsreader for body, Bricolage for display)',
            'Issue / volume metadata on the homepage',
            'Optional sidebar TOC on long posts; floats in viewport above 900px',
            'Reading progress indicator',
            'Built-in newsletter signup section',
        ],
        sectionList: [
            { name: 'IssueHero', description: 'Cover image + issue number + featured story' },
            { name: 'StoryGrid', description: '3-column grid of stories with category tags' },
            { name: 'PullQuote', description: 'Large standalone editorial quote' },
            { name: 'AuthorRow', description: '4–6 author bios with photo + recent stories' },
            { name: 'NewsletterSignup', description: 'Email capture with preview thumbnails' },
            { name: 'BackIssues', description: 'Archive of past issues with date + cover' },
            { name: 'Footer', description: 'Newsletter + social + masthead' },
        ],
        bestFor: 'Online magazines, company-published longform, indie newsletters that want a permanent home.',
    },
    'mero-studio': {
        slug: 'mero-studio',
        name: 'Mero Studio',
        tagline: 'Portfolio + case study',
        description:
            'Image-led portfolio for design studios, agencies, and freelancers. Lando-style horizontal scroll galleries, large project covers, soft cursor, generous spacing.',
        color: 'var(--pastel-lav)',
        sections: 6,
        repo: 'github.com/merocms/themes/mero-studio',
        features: [
            'Horizontal scroll project gallery (GSAP-driven)',
            'Custom soft cursor that grows on hover targets',
            'Full-bleed project covers with metadata overlay',
            'Sticky table of contents on long case studies',
            'Smooth section transitions with shared element animations',
        ],
        sectionList: [
            { name: 'StudioHero', description: 'Bold opening with the studio name and lead project' },
            { name: 'ProjectGallery', description: 'Horizontal scroll of recent projects' },
            { name: 'About', description: 'Studio bio, principles, and team' },
            { name: 'CaseStudy', description: 'Long-form project breakdown layout' },
            { name: 'ServicesList', description: 'Capabilities + pricing tiers if relevant' },
            { name: 'ContactBlock', description: 'Single-line "let\'s work together" with form' },
        ],
        bestFor: 'Design studios, motion shops, brand agencies, freelance designers.',
    },
    'mero-docs': {
        slug: 'mero-docs',
        name: 'Mero Docs',
        tagline: 'Documentation',
        description:
            'Sidebar nav, callouts, code blocks, search — everything you need to ship a doc site that doesn&apos;t fight you. Built for technical products.',
        color: 'var(--pastel-sky)',
        sections: 5,
        repo: 'github.com/merocms/themes/mero-docs',
        features: [
            'Three-pane layout: nav / content / table of contents',
            'Built-in search with keyboard shortcut (⌘K)',
            'Light + dark mode toggle, persists per visitor',
            'Code blocks with syntax highlighting + copy button',
            'Callout components: info, warning, danger, success',
        ],
        sectionList: [
            { name: 'DocsLayout', description: 'Three-pane shell with sidebar + TOC' },
            { name: 'DocPage', description: 'Long-form article with frontmatter' },
            { name: 'APIReference', description: 'Endpoint table with request/response shapes' },
            { name: 'Changelog', description: 'Versioned release notes' },
            { name: 'Search', description: 'Full-text + heading search' },
        ],
        bestFor: 'Open-source projects, internal docs sites, developer-facing products.',
    },
};

export function getTheme(slug: string): ThemeEntry | null {
    return THEMES[slug] || null;
}
export function listThemes(): ThemeEntry[] {
    return Object.values(THEMES);
}
