import { Injectable, BadRequestException } from '@nestjs/common';
import { PackagesService } from '../packages/packages.service';

/**
 * Named preset keys supported by the AI Studio. Each one seeds a curated
 * system prompt and returns output in the shape the call-site expects.
 * Keep in sync with PRESET_META / the frontend preset grid.
 */
export type AiPresetKey =
    | 'blog_draft'
    | 'page_copy'
    | 'seo_meta'
    | 'alt_text'
    | 'email_subject'
    | 'faq'
    | 'product_description';

export interface AiPresetMeta {
    key: AiPresetKey;
    label: string;
    description: string;
    /** One-line hint shown above the prompt input. */
    promptHint: string;
    /** Optional context placeholder — when present, the UI shows a second input. */
    contextHint?: string;
    icon: string; // lucide-react icon name
    category: 'writing' | 'seo' | 'commerce' | 'ops';
}

export const PRESET_META: Record<AiPresetKey, AiPresetMeta> = {
    blog_draft: {
        key: 'blog_draft',
        label: 'Blog draft',
        description: 'Outline or full-draft a blog post from a one-line topic.',
        promptHint: 'What should the post be about?',
        contextHint: 'Any existing notes, quotes, or bullet points (optional)',
        icon: 'PenLine',
        category: 'writing',
    },
    page_copy: {
        key: 'page_copy',
        label: 'Page copy',
        description: 'Polish or rewrite any block of page copy for clarity and tone.',
        promptHint: 'What should this page say?',
        contextHint: 'Paste the existing copy to polish (optional)',
        icon: 'Sparkles',
        category: 'writing',
    },
    seo_meta: {
        key: 'seo_meta',
        label: 'SEO meta description',
        description: 'Generate a 150-char meta description from page content.',
        promptHint: 'Page title or one-line description',
        contextHint: 'Full page content',
        icon: 'Search',
        category: 'seo',
    },
    alt_text: {
        key: 'alt_text',
        label: 'Image alt text',
        description: 'Describe an image for screen readers and search engines.',
        promptHint: 'What does the image show?',
        icon: 'ImageIcon',
        category: 'seo',
    },
    email_subject: {
        key: 'email_subject',
        label: 'Email subject line',
        description: 'Five punchy subject-line options for a newsletter or announcement.',
        promptHint: 'What is the email about?',
        icon: 'Mail',
        category: 'writing',
    },
    faq: {
        key: 'faq',
        label: 'FAQ answer',
        description: 'Answer a customer FAQ in a clear, friendly tone.',
        promptHint: 'The question to answer',
        contextHint: 'Relevant policy or docs (optional)',
        icon: 'HelpCircle',
        category: 'ops',
    },
    product_description: {
        key: 'product_description',
        label: 'Product description',
        description: 'A compelling product blurb for shops and marketplaces.',
        promptHint: 'Name + one-line summary of the product',
        contextHint: 'Features, specs, or target audience (optional)',
        icon: 'ShoppingBag',
        category: 'commerce',
    },
};

@Injectable()
export class AiService {
    constructor(private packagesService: PackagesService) {}

    /**
     * Public generate entry point. `preset` is optional — when absent the
     * generator falls back to the legacy keyword-detection behaviour used by
     * the blog AiAssistant, so we don't regress that flow.
     */
    async generate(prompt: string, context: string = '', preset?: AiPresetKey | string) {
        const usage = await this.packagesService.getUsage();
        if (!usage?.package.aiEnabled) {
            throw new BadRequestException(
                'AI features are not enabled for your current plan. Please upgrade to Pro or Enterprise.',
            );
        }

        // Route through the preset-specific generator when a known preset
        // key is provided; otherwise fall through to the legacy generator.
        if (preset && preset in PRESET_META) {
            return this.presetGeneration(preset as AiPresetKey, prompt, context);
        }

        return this.mockGeneration(prompt, context);
    }

    /** Returns the preset catalogue for the /ai/templates endpoint. */
    listPresets(): AiPresetMeta[] {
        return Object.values(PRESET_META);
    }

    // ─── Preset-specific mock generators ─────────────────────────────────────
    // Each branch produces output in the format a real caller would actually
    // want — SEO meta is 150 chars, email subjects are a 5-item list, etc.
    // Swap these for real LLM calls when the provider is wired up.

    private async presetGeneration(preset: AiPresetKey, prompt: string, context: string) {
        // Simulate the network round-trip
        await new Promise((resolve) => setTimeout(resolve, 1200));
        const p = (prompt || '').trim();
        const c = (context || '').trim();

        switch (preset) {
            case 'blog_draft':
                return [
                    `# ${p || 'Untitled post'}`,
                    '',
                    c
                        ? `Building on your notes — ${c.slice(0, 120)}${c.length > 120 ? '…' : ''}`
                        : '',
                    '',
                    '## Why this matters',
                    `${p || 'This'} touches more of the team than most people realise. Here is how it fits together.`,
                    '',
                    '## Three concrete moves',
                    '1. Audit the current state — be honest about what is working.',
                    '2. Pick the highest-leverage change and ship it this week.',
                    '3. Measure the delta, and publish it internally.',
                    '',
                    '## Where we go next',
                    'Turn this into a living doc. Come back in a month and either double down or cut it.',
                ]
                    .filter(Boolean)
                    .join('\n');

            case 'page_copy':
                if (!c) {
                    return `${p || 'Your message,'} delivered with confidence. Built for the people who take ownership of their craft — and ship work that compounds.`;
                }
                return `[Polished] ${c
                    .replace(/\s+/g, ' ')
                    .replace(/[.!?]\s+/g, '. ')
                    .trim()} Now with crisper verbs, tighter cadence, and no hedge words.`;

            case 'seo_meta': {
                const base = `${p || 'Your page'} — practical guidance, clear examples, and actionable next steps. Start here.`;
                return base.slice(0, 160);
            }

            case 'alt_text': {
                const focus = p || 'an image';
                return `Photo showing ${focus.toLowerCase()}, composed with clear subject focus and balanced lighting for accessibility.`;
            }

            case 'email_subject':
                return [
                    `1. ${p || 'The update'} is here — and it changes everything`,
                    `2. A quick note about ${p || 'our next move'}`,
                    `3. ${p || 'We shipped it'} (and what you should know)`,
                    `4. The one thing we want you to read about ${p || 'this week'}`,
                    `5. Tiny update, big implications → ${p || 'read inside'}`,
                ].join('\n');

            case 'faq':
                return [
                    `**${p || 'Great question.'}**`,
                    '',
                    `${c ? `Based on ${c.slice(0, 80)}${c.length > 80 ? '…' : ''}, here is the short answer:` : 'Here is the short answer:'}`,
                    '',
                    `Yes — ${p || 'this'} is supported. Here is what to expect and how to get started:`,
                    '',
                    '- Navigate to the relevant section in your dashboard',
                    '- Follow the three-step wizard — it is the same flow most teams use',
                    '- Reach out to support if you hit anything unexpected',
                ].join('\n');

            case 'product_description':
                return `${p || 'This product'} is built for people who care about the details. ${c ? `Designed around ${c.slice(0, 80)}${c.length > 80 ? '…' : ''}, it` : 'It'} blends practical engineering with a quiet, considered aesthetic — ready to work the moment you open the box.`;
        }
    }

    private async mockGeneration(prompt: string, context: string) {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const p = prompt.toLowerCase();

        if (p.includes('continue') || p.includes('complete')) {
            return `Based on your previous context about "${context.slice(0, 50)}...", here is a follow-up: \n\nThis development represents a significant milestone in our roadmap. By leveraging modern architectural patterns, we ensure that the system remains scalable and maintainable for future growth. Furthermore, the integration of real-time feedback loops allows for a more responsive user experience.`;
        }

        if (p.includes('summarize')) {
            return `SUMMARY: This article discusses the core principles of building scalable CMS platforms, emphasizing the importance of modular architecture, package-based enforcement, and premium design aesthetics.`;
        }

        if (p.includes('tone') || p.includes('professional')) {
            return `[Professional Redraft]: The implementation of the proposed system architecture will facilitate enhanced operational efficiency. We recommend a phased approach to ensure seamless integration with existing infrastructure while maintaining high availability standards.`;
        }

        return `AI Suggestion: To further improve this section, consider adding more specific examples and data points to support your claims. A balanced perspective will enhance the credibility of your content.`;
    }
}
