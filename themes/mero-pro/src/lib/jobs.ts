/**
 * Job descriptions — keyed by slug. Hardcoded scaffolding; real
 * deployments will source from /api/careers or an HR system.
 */
export interface Job {
    slug: string;
    title: string;
    team: string;
    location: string;
    type: 'full-time' | 'contract' | 'part-time';
    summary: string;
    youll: string[]; // "What you'll do"
    youAre: string[]; // "What we're looking for"
    bonus: string[]; // "Nice to have"
    process: { step: string; detail: string }[];
}

const JOBS: Record<string, Job> = {
    'senior-product-engineer': {
        slug: 'senior-product-engineer',
        title: 'Senior Product Engineer',
        team: 'Engineering',
        location: 'Kathmandu / Remote (UTC+0 to UTC+8)',
        type: 'full-time',
        summary:
            'Own a vertical slice of the Mero CMS admin — likely the visual editor or AI Studio — alongside two other senior engineers and a product designer. React + TypeScript on the front, occasional dabbling in Node + Postgres on the back.',
        youll: [
            'Design and ship features end-to-end on the admin: visual editor, AI Studio, capability matrix tooling, or the audit log surface.',
            'Pair with the product designer weekly; we treat design and engineering as a single discipline, not a handoff.',
            'Write the docs for the features you ship. Yes, really. Two people maintain the docs site and that&apos;s plenty.',
            'Triage your own bugs. We don&apos;t have a separate QA team — engineers own the quality of what they ship.',
            "Help shape the roadmap. Senior engineers participate in the quarterly planning, not just execute it.",
        ],
        youAre: [
            'A senior IC with 6+ years building product, ideally something with a long-lived UI like a CMS, IDE, design tool, or admin panel.',
            'Strong with TypeScript and React. Comfortable with server components, suspense, and the modern Next.js App Router.',
            'Opinionated about UX — you&apos;ll push back on a feature spec when the editor experience suffers.',
            'Comfortable in the backend when needed. We use Node + Postgres + Prisma; nothing exotic.',
            'A clear writer. You&apos;ll write docs, RFCs, and the occasional blog post.',
        ],
        bonus: [
            'Have shipped a CMS, page builder, or no-code tool before',
            'Familiar with motion + interaction design (we use Framer Motion + GSAP)',
            'Open-source contributions we can read',
            'Speak a second language — our customer base is global',
        ],
        process: [
            { step: 'Apply', detail: 'A short form with a link to your work and one paragraph on why this role.' },
            {
                step: '30-min intro call',
                detail: "Mutual fit. We talk about how we work; you talk about what you're looking for.",
            },
            {
                step: 'Take-home (paid)',
                detail: '4–6 hours, your timeline. Build a small editor feature in our codebase. We pay $400 for the work regardless of outcome.',
            },
            { step: 'Pairing session', detail: '90 minutes pairing on a real bug or small feature with the team.' },
            { step: 'Decision', detail: 'Within 5 business days of the pairing. We give detailed feedback either way.' },
        ],
    },
    'product-designer': {
        slug: 'product-designer',
        title: 'Product Designer',
        team: 'Design',
        location: 'Kathmandu / Remote',
        type: 'full-time',
        summary:
            'Design the next major versions of the Mero CMS admin alongside the founders and the engineering team. You own the editor, the dashboard, and the section variant system.',
        youll: [
            "Own the design of the visual editor, AI Studio, and the dashboard surfaces — from research through shipped pixels.",
            "Lead user research with our customers — interviews, usability sessions, and the occasional shadow-day at a customer site.",
            "Work in Figma and the codebase. We expect designers to branch the codebase and make small changes themselves.",
            'Define + maintain the design system as it grows. Currently lightweight; you have room to formalise.',
            'Pair with engineering daily. We don&apos;t do hand-offs.',
        ],
        youAre: [
            '5+ years designing product, ideally something with rich interaction (editor, IDE, design tool, admin panel).',
            'Strong portfolio with shipped work — we want to see actual product in use, not concepts.',
            'Comfortable in code (HTML/CSS at minimum, ideally a little React). You can prototype in the codebase.',
            'Care deeply about typography, motion, and the boring details of input fields.',
            'Good writer. You&apos;ll write design specs, customer interview summaries, and decision rationales.',
        ],
        bonus: [
            'Background in editorial design or print',
            'Experience designing CMSes, page builders, or other content tools',
            'Have led a design system through a major revision',
        ],
        process: [
            { step: 'Apply', detail: 'Send your portfolio plus one paragraph on why this role.' },
            { step: 'Portfolio walkthrough', detail: '60 minutes — you show us 2–3 projects in depth.' },
            {
                step: 'Design exercise (paid)',
                detail: '6 hours, your timeline. Redesign one screen of the Mero admin and explain your decisions.',
            },
            { step: 'Pairing session', detail: '90 minutes co-designing in Figma with our team.' },
            { step: 'Decision', detail: 'Within 5 business days.' },
        ],
    },
    'developer-advocate': {
        slug: 'developer-advocate',
        title: 'Developer Advocate',
        team: 'Marketing',
        location: 'Remote',
        type: 'full-time',
        summary:
            "Own the developer-facing surface of Mero CMS: docs, example themes, the developer community. You ship code as much as you ship words, and the line between you and the engineering team is intentionally blurry.",
        youll: [
            'Write and maintain the documentation. You can re-architect the docs site if you think it should change.',
            "Build and maintain reference themes. Currently three; we'd like five+ and you decide which ones to add.",
            'Run the developer-facing community — Discord, GitHub Discussions, the occasional in-person event.',
            'Talk at conferences when relevant. We pay travel + a generous speaking budget.',
            'Write blog posts that engineers actually want to read — deep, technical, opinionated.',
        ],
        youAre: [
            "A working engineer who loves teaching. You've shipped real product and you know what it feels like.",
            'Excellent technical writer. We&apos;ll ask for samples; we want concise, opinionated, accurate writing.',
            'Comfortable speaking publicly — at meetups, on podcasts, occasionally at conferences.',
            'Thoughtful about community management — you understand what makes a developer community good.',
            "5+ years writing software, ideally with at least one stint in DevRel, technical writing, or a heavy-OSS engineering role.",
        ],
        bonus: [
            'Familiar with the JS/TS ecosystem (Next.js, React, Node)',
            'Experience running a Discord or community at scale',
            'Have spoken at conferences before',
        ],
        process: [
            { step: 'Apply', detail: 'Send writing samples + a link to a project you&apos;ve led.' },
            { step: 'Intro call', detail: "60 minutes. We want to hear how you think about teaching." },
            {
                step: 'Writing exercise (paid)',
                detail: 'Write a 1,000-word tutorial post for the Mero docs on a topic of your choice. We pay $300 for the work.',
            },
            { step: 'Talk + pairing', detail: 'You talk us through the post + we pair on a small docs improvement.' },
            { step: 'Decision', detail: 'Within 5 business days.' },
        ],
    },
    'customer-engineer': {
        slug: 'customer-engineer',
        title: 'Customer Engineer (Enterprise)',
        team: 'Customer success',
        location: 'EU timezone preferred',
        type: 'full-time',
        summary:
            "White-glove onboarding for our largest customers. You make the first 30 days feel effortless — bespoke setup, integration help, training — then graduate them to self-serve. Half engineering, half customer success.",
        youll: [
            'Run kick-off calls with every new Enterprise customer. Audit their existing stack, plan the migration, set expectations.',
            "Build custom integrations and theme tweaks for them. You're a working engineer with empathy for non-engineers.",
            'Train their teams on the admin. Live sessions, recorded walkthroughs, written runbooks.',
            'Be the on-call escalation for the first 30 days; then graduate them to standard support.',
            'Feed customer learnings back to the product team — you sit on every quarterly planning meeting.',
        ],
        youAre: [
            '4+ years in a hybrid customer-success / engineering role, ideally at a B2B SaaS with a complex product.',
            'Strong with the JS/TS ecosystem; comfortable in Next.js codebases.',
            'Excellent communicator — written + spoken. You&apos;ll be on calls daily.',
            'Calm under pressure. The first migration is always rough; you keep customers calm while we fix things.',
            'Self-directed. We&apos;ll set goals, you decide how to hit them.',
        ],
        bonus: [
            'Experience with a competing CMS (WordPress, Contentful, Sanity, Strapi)',
            'Background in solutions engineering or developer support',
            'Comfortable demoing the product on stage',
        ],
        process: [
            { step: 'Apply', detail: 'A short form + a paragraph on a recent migration you led.' },
            { step: 'Intro call', detail: '60 minutes — fit + a deep dive on customer support philosophy.' },
            {
                step: 'Customer scenario',
                detail: 'A take-home: a fictional customer email; you draft the response + a 30-day plan. 4 hours; we pay $300.',
            },
            { step: 'Onsite (or video) panel', detail: '3 hours with the team — pairing, planning, mock customer call.' },
            { step: 'Decision', detail: 'Within 5 business days.' },
        ],
    },
};

export function getJob(slug: string): Job | null {
    return JOBS[slug] || null;
}
export function listJobs(): Job[] {
    return Object.values(JOBS);
}
