/**
 * Customer story data — keyed by slug. Hardcoded today so the
 * /customers/[slug] route renders without backend; can be wired
 * to the admin's customer-stories collection later.
 */
export interface CustomerStory {
    slug: string;
    company: string;
    industry: string;
    headline: string;
    subheading: string;
    color: string; // pastel for the hero band
    metric: string;
    metricLabel: string;
    pullQuote: { quote: string; name: string; role: string };
    challenge: string[];
    approach: string[];
    outcomes: { metric: string; label: string }[];
    facts: { label: string; value: string }[];
}

const STORIES: Record<string, CustomerStory> = {
    'northwind': {
        slug: 'northwind',
        company: 'Northwind',
        industry: 'B2B SaaS · Series B',
        headline: 'Three tools became one. Their redesign shipped in six weeks.',
        subheading:
            'Northwind replaced a CMS, a landing page builder, and a custom forms backend with a single Mero CMS deployment — and shipped a full marketing site rebuild in six weeks instead of two quarters.',
        color: 'var(--pastel-pist)',
        metric: '−72%',
        metricLabel: 'time-to-publish for marketing edits',
        pullQuote: {
            quote:
                "We replaced three tools with Mero CMS. Marketing edits live, devs never touch the admin, the audit log keeps the lawyers happy.",
            name: 'Elise Wendel',
            role: 'Head of Marketing',
        },
        challenge: [
            'Marketing edits required engineering tickets that took 3–5 days to ship — anything urgent meant a Slack escalation.',
            'Three separate tools (CMS, landing page builder, forms backend) meant three separate auth, audit, and brand-styling problems.',
            'Compliance review on every published page because the audit trail spanned multiple systems with different export formats.',
        ],
        approach: [
            'Migrated 80+ existing pages into Mero CMS section variants over four weeks; the visual editor handled the long tail of one-off pages.',
            'Forms section variant absorbed the custom forms backend; HMAC-signed delivery to their existing CRM webhook stayed unchanged.',
            'White-label admin shipped to internal users so the experience felt like Northwind, not a third-party tool.',
        ],
        outcomes: [
            { metric: '−72%', label: 'time-to-publish for marketing edits' },
            { metric: '6 weeks', label: 'redesign delivery vs. 2 quarters previously' },
            { metric: '0', label: 'engineering tickets per quarter for marketing edits' },
            { metric: '1', label: 'audit log to satisfy compliance, not three' },
        ],
        facts: [
            { label: 'Founded', value: '2019' },
            { label: 'Team size', value: '120' },
            { label: 'Mero tier', value: 'Enterprise' },
            { label: 'Editors', value: '14' },
            { label: 'Live since', value: 'Feb 2026' },
        ],
    },
    'lenis': {
        slug: 'lenis',
        company: 'Lenis',
        industry: 'Consumer hardware',
        headline: 'AI Studio writes brand-matched SEO copy across 1,200+ products.',
        subheading:
            "Lenis runs Mero CMS at the heart of their commerce site. AI Studio drafts meta descriptions, alt text, and category copy in their voice — they review, tweak, ship.",
        color: 'var(--pastel-coral)',
        metric: '1,200+',
        metricLabel: 'product pages with brand-matched copy',
        pullQuote: {
            quote:
                'AI Studio drafts our meta descriptions in a tone that matches our brand. We&rsquo;ve stopped writing them from scratch.',
            name: 'Mira Calder',
            role: 'Content Director',
        },
        challenge: [
            'Every product launch needed unique meta descriptions, alt text, and category copy — the content team became a bottleneck.',
            'Outsourced copywriting cost $$ and didn&rsquo;t consistently match the Lenis voice; QA churn was high.',
            'Multilingual launches doubled the workload without improving conversion proportionally.',
        ],
        approach: [
            'Set up AI Studio presets for the four content types they ship most: meta description, alt text, category intro, product feature blurb.',
            'Trained the prompt library on 200 hand-written examples so output landed in the brand voice on the first draft 80% of the time.',
            'Editor approval workflow keeps a human in the loop — AI drafts are never auto-published.',
        ],
        outcomes: [
            { metric: '1,200+', label: 'product pages with brand-matched copy' },
            { metric: '4x', label: 'content team output' },
            { metric: '−65%', label: 'cost per product launch on content alone' },
            { metric: '11', label: 'languages supported via AI translation preset' },
        ],
        facts: [
            { label: 'Founded', value: '2017' },
            { label: 'Team size', value: '85' },
            { label: 'Mero tier', value: 'Pro' },
            { label: 'Editors', value: '7' },
            { label: 'Live since', value: 'Aug 2025' },
        ],
    },
    'toolfolio': {
        slug: 'toolfolio',
        company: 'Toolfolio',
        industry: 'Developer tooling',
        headline: 'Three engineers run a marketing site twelve marketers edit.',
        subheading:
            'After moving to Mero CMS, Toolfolio&rsquo;s engineering team stopped getting paged for marketing copy edits. Marketing ships faster, engineering ships product.',
        color: 'var(--pastel-sky)',
        metric: '0',
        metricLabel: "engineering tickets per quarter for marketing edits",
        pullQuote: {
            quote:
                'The visual editor is the first one I&rsquo;ve shown a marketer where they didn&rsquo;t immediately ask for help. That&rsquo;s the bar.',
            name: 'Raj Joshi',
            role: 'Staff Engineer',
        },
        challenge: [
            'Marketing was the #1 source of engineering interrupt — a small copy edit could cost 20 minutes of context-switching.',
            'Their previous CMS required engineering to ship section variants every time marketing wanted a layout change.',
            'No clear audit log meant production incidents from accidental edits were hard to triage.',
        ],
        approach: [
            'Built three custom section variants in their fork of the Mero theme; marketing now composes pages from those.',
            'Visual editor enabled with role-based gates — marketing has full edit access, contractors are read-only.',
            'Audit log piped to the engineering observability stack so any production change is trackable.',
        ],
        outcomes: [
            { metric: '0', label: 'engineering tickets per quarter for marketing edits' },
            { metric: '3', label: 'engineers maintain a site 12 marketers edit daily' },
            { metric: '+22%', label: 'organic traffic over 6 months from faster A/B iteration' },
            { metric: '90ms', label: 'publish-to-live for visual editor changes' },
        ],
        facts: [
            { label: 'Founded', value: '2020' },
            { label: 'Team size', value: '45' },
            { label: 'Mero tier', value: 'Studio' },
            { label: 'Editors', value: '12' },
            { label: 'Live since', value: 'Nov 2025' },
        ],
    },
    'jitter': {
        slug: 'jitter',
        company: 'Jitter',
        industry: 'Motion design',
        headline: 'A white-labeled Mero CMS deployment for 24 agency partners.',
        subheading:
            "Jitter resells a customised version of Mero CMS to their agency partners as part of their motion-design platform. Same product, agency branding, agency&rsquo;s own admin.",
        color: 'var(--pastel-butter)',
        metric: '24',
        metricLabel: 'agency partners running on white-labeled Mero CMS',
        pullQuote: {
            quote:
                'Eight tiers sounded like overkill. Then we needed exactly tier 6 and didn&rsquo;t have to re-architect anything to get there.',
            name: 'Daniel Kovac',
            role: 'VP Engineering',
        },
        challenge: [
            'Agency partners wanted a CMS bundled with Jitter&rsquo;s motion-design platform but each had different brand requirements.',
            'Building agency-specific UI variations would&rsquo;ve required a maintenance burden Jitter&rsquo;s team couldn&rsquo;t carry.',
            'They needed full audit and tier-gating so agencies could pass-through the tier model to their own clients.',
        ],
        approach: [
            'Configured Mero CMS in white-label mode — agencies see their own logo, colors, and admin URL.',
            'Capability matrix passes through transparently so agencies can offer their own clients tier-gated features.',
            'Single Mero deployment per agency, hosted in Jitter&rsquo;s infrastructure. Each agency gets isolated content + media.',
        ],
        outcomes: [
            { metric: '24', label: 'agency partners running on white-labeled Mero CMS' },
            { metric: '$0', label: 'engineering cost per new agency onboarded' },
            { metric: '6 weeks', label: 'first-agency launch from contract to production' },
            { metric: '+38%', label: 'platform NRR after Mero CMS bundle launched' },
        ],
        facts: [
            { label: 'Founded', value: '2021' },
            { label: 'Team size', value: '60' },
            { label: 'Mero tier', value: 'Enterprise (white-label)' },
            { label: 'Agencies', value: '24' },
            { label: 'Live since', value: 'Sep 2025' },
        ],
    },
};

export function getCustomerStory(slug: string): CustomerStory | null {
    return STORIES[slug] || null;
}

export function listCustomerStories(): CustomerStory[] {
    return Object.values(STORIES);
}
