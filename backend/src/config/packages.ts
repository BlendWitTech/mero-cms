export type WebsiteType = 'personal' | 'organizational';
export type PackageId =
    | 'personal-basic' | 'personal-premium' | 'personal-professional'
    | 'org-basic' | 'org-premium' | 'org-enterprise' | 'org-custom';

export interface CmsPackage {
    id: PackageId;
    name: string;
    websiteType: WebsiteType;
    tier: 1 | 2 | 3 | 4;
    aiEnabled: boolean;
    priceNPR: number | { min: number; max: number } | 'custom';
    tagline: string;
    features: string[];
    comingSoon?: string[];
    starterThemes: string[];
    supportLevel: 'email' | 'priority' | 'dedicated';
    highlighted?: boolean;
}

export const PACKAGES: CmsPackage[] = [
    // --- Personal Websites ---
    {
        id: 'personal-basic',
        name: 'Starter Blog',
        websiteType: 'personal',
        tier: 1,
        aiEnabled: false,
        priceNPR: 4999,
        tagline: 'Ideal for hobbyists and individual bloggers.',
        features: [
            'Core CMS Access',
            '10GB Storage',
            'Basic SEO Tools',
            'Standard Themes',
            'Community Support'
        ],
        starterThemes: ['minimal-blog', 'clean-writer'],
        supportLevel: 'email'
    },
    {
        id: 'personal-premium',
        name: 'Portfolio Pro',
        websiteType: 'personal',
        tier: 2,
        aiEnabled: true,
        priceNPR: 9999,
        tagline: 'Perfect for freelancers & creative professionals.',
        features: [
            'Unlimited Posts & Pages',
            '50GB Storage',
            'AI Content Assistant',
            'Custom Themes Support',
            'Lead Management',
            'Testimonials Module'
        ],
        starterThemes: ['modern-portfolio', 'dark-creative', 'minimal-blog'],
        supportLevel: 'priority',
        highlighted: true
    },
    {
        id: 'personal-professional',
        name: 'Personal Brand',
        websiteType: 'personal',
        tier: 3,
        aiEnabled: true,
        priceNPR: 19999,
        tagline: 'Scale your personal brand with full control.',
        features: [
            'White-labeled CMS (Basics)',
            '200GB Storage',
            'Advanced AI Workflow',
            'Newsletter Integration',
            'Global Edge Deployment',
            'Custom Webhooks'
        ],
        starterThemes: ['executive-brand', 'storyteller-pro'],
        supportLevel: 'priority'
    },

    // --- Organizational Websites ---
    {
        id: 'org-basic',
        name: 'Business Foundation',
        websiteType: 'organizational',
        tier: 2,
        aiEnabled: true,
        priceNPR: 24999,
        tagline: 'Robust infrastructure for small businesses.',
        features: [
            'Multi-User (up to 5)',
            'Role Based Permissions',
            '100GB Shared Storage',
            'Services & Team Modules',
            'Form Builder (Unlimited)',
            'Basic Analytics'
        ],
        starterThemes: ['corporate-lite', 'service-business'],
        supportLevel: 'priority'
    },
    {
        id: 'org-premium',
        name: 'Agency Edition',
        websiteType: 'organizational',
        tier: 3,
        aiEnabled: true,
        priceNPR: 49999,
        tagline: 'High-performance CMS for growing agencies.',
        features: [
            'Unlimited Team Members',
            'Multi-Site Management',
            'Audit Logging',
            'Advanced SEO Pack',
            'Dynamic Content Collections',
            'Priority 24/7 Support'
        ],
        starterThemes: ['agency-ultimate', 'business-complex'],
        supportLevel: 'priority',
        highlighted: true
    },
    {
        id: 'org-enterprise',
        name: 'Enterprise Cloud',
        websiteType: 'organizational',
        tier: 4,
        aiEnabled: true,
        priceNPR: { min: 99999, max: 249999 },
        tagline: 'Custom infrastructure for large scale deployments.',
        features: [
            'Dedicated Private Database',
            'SLA Guarantee (99.9%)',
            'SSO / SAML Integration',
            'Bi-Annual Security Audit',
            'Custom Feature Development',
            'Dedicated Account Manager'
        ],
        starterThemes: ['enterprise-custom'],
        supportLevel: 'dedicated'
    },
    {
        id: 'org-custom',
        name: 'Tailored Solution',
        websiteType: 'organizational',
        tier: 4,
        aiEnabled: true,
        priceNPR: 'custom',
        tagline: 'When "Off-the-shelf" is not an option.',
        features: [
            'Custom Module Development',
            'On-Premise Deployment Option',
            'Direct DB Access',
            'API-First Headless Only Option',
            'White-Glove Migration Service'
        ],
        starterThemes: ['any'],
        supportLevel: 'dedicated'
    }
];
