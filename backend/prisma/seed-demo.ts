/**
 * seed-demo.ts
 * Full demo environment seed for Mero CMS.
 * Populates all content tables with realistic data showcasing every module.
 *
 * Run: npm run seed:demo
 * Called automatically by docker-compose.demo.yml on container start.
 *
 * Idempotent: safe to run multiple times (clears content tables first, then recreates).
 * Does NOT clear structural tables (roles). Users are upserted by email.
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slug(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

function daysAgo(n: number): Date {
    return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function daysFromNow(n: number): Date {
    return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('╔══════════════════════════════════════╗');
    console.log('║   Mero CMS — Demo Seed Starting      ║');
    console.log('╚══════════════════════════════════════╝');

    // ── 1. Roles ───────────────────────────────────────────────────────────────
    console.log('\n[1/13] Roles...');

    const superAdminRole = await prisma.role.upsert({
        where: { name: 'Super Admin' },
        update: { level: 0 },
        create: { name: 'Super Admin', level: 0, permissions: { all: true } },
    });

    const adminRole = await prisma.role.upsert({
        where: { name: 'Admin' },
        update: {},
        create: {
            name: 'Admin', level: 5,
            permissions: {
                content_view: true, content_create: true, content_edit: true, content_delete: true,
                media_view: true, media_upload: true, media_delete: true,
                users_view: true, users_create: true, users_edit: true,
                roles_view: true, settings_edit: true, leads_view: true, audit_view: true,
            },
        },
    });

    const editorRole = await prisma.role.upsert({
        where: { name: 'Editor' },
        update: {},
        create: {
            name: 'Editor', level: 10,
            permissions: {
                content_view: true, content_create: true, content_edit: true,
                media_view: true, media_upload: true,
            },
        },
    });

    const authorRole = await prisma.role.upsert({
        where: { name: 'Author' },
        update: {},
        create: {
            name: 'Author', level: 20,
            permissions: { content_view: true, content_create: true, media_view: true },
        },
    });

    console.log('  ✓ 4 roles');

    // ── 2. Demo Users ──────────────────────────────────────────────────────────
    console.log('\n[2/13] Users...');
    const demoPassword = process.env.DEMO_ADMIN_PASSWORD || 'demo1234';
    const hashedPassword = await bcrypt.hash(demoPassword, 10);

    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@merocms.test' },
        update: { password: hashedPassword, name: 'Demo Admin', isActive: true },
        create: {
            email: 'admin@merocms.test',
            password: hashedPassword,
            name: 'Demo Admin',
            roleId: superAdminRole.id,
            bio: 'Full-access demo account. Explore every feature of Mero CMS.',
            avatar: 'https://ui-avatars.com/api/?name=Demo+Admin&background=2563EB&color=fff&size=128',
            isActive: true,
        },
    });

    const editorUser = await prisma.user.upsert({
        where: { email: 'editor@merocms.test' },
        update: { password: hashedPassword, name: 'Demo Editor', isActive: true },
        create: {
            email: 'editor@merocms.test',
            password: hashedPassword,
            name: 'Demo Editor',
            roleId: editorRole.id,
            bio: 'Content editor account — create and manage posts, pages, and media.',
            avatar: 'https://ui-avatars.com/api/?name=Demo+Editor&background=7C3AED&color=fff&size=128',
            isActive: true,
        },
    });

    const authorUser = await prisma.user.upsert({
        where: { email: 'author@merocms.test' },
        update: { password: hashedPassword, name: 'Demo Author', isActive: true },
        create: {
            email: 'author@merocms.test',
            password: hashedPassword,
            name: 'Demo Author',
            roleId: authorRole.id,
            bio: 'Author account — write your own posts and view published content.',
            avatar: 'https://ui-avatars.com/api/?name=Demo+Author&background=059669&color=fff&size=128',
            isActive: true,
        },
    });

    console.log(`  ✓ 3 demo users (password: ${demoPassword})`);

    // ── 3. Clear content tables (so re-runs are clean) ─────────────────────────
    console.log('\n[3/13] Clearing existing demo content...');

    await prisma.formSubmission.deleteMany({});
    await prisma.form.deleteMany({});
    await prisma.collectionItem.deleteMany({});
    await prisma.collection.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.tag.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.page.deleteMany({});
    await prisma.lead.deleteMany({});
    await prisma.menuItem.deleteMany({});
    await prisma.menu.deleteMany({});
    await prisma.teamMember.deleteMany({});
    await prisma.testimonial.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.webhook.deleteMany({});
    await prisma.activityLog.deleteMany({});
    await prisma.setting.deleteMany({ where: { key: { startsWith: 'demo_' } } });

    console.log('  ✓ Content tables cleared');

    // ── 4. Settings ────────────────────────────────────────────────────────────
    console.log('\n[4/13] Settings...');

    const settings = [
        { key: 'site_title', value: 'Mero CMS Demo' },
        { key: 'site_tagline', value: 'Elevate Your Content Strategy' },
        { key: 'site_description', value: 'This is a live demo of Mero CMS. Feel free to explore — it resets every 2 hours.' },
        { key: 'contact_email', value: 'demo@merocms.test' },
        { key: 'primary_color', value: '#2563EB' },
        { key: 'secondary_color', value: '#6366F1' },
        { key: 'site_url', value: 'https://demo.mero-cms.com' },
        { key: 'cms_title', value: 'Mero CMS' },
        { key: 'cms_subtitle', value: 'Elevate Your Content Strategy' },
        { key: 'setup_complete', value: 'true' },
        { key: 'enabled_modules', value: 'blogs,categories,tags,comments,team,services,testimonials,leads,seo,redirects,analytics,sitemap,robots,forms,webhooks,collections' },
        { key: 'github_url', value: 'https://github.com/blendwit/mero-cms' },
        { key: 'twitter_url', value: 'https://twitter.com/merocms' },
        { key: 'demo_next_reset', value: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() },
    ];

    for (const s of settings) {
        await prisma.setting.upsert({
            where: { key: s.key },
            update: { value: s.value },
            create: s,
        });
    }

    console.log(`  ✓ ${settings.length} settings`);

    // ── 5. Categories & Tags ───────────────────────────────────────────────────
    console.log('\n[5/13] Categories & Tags...');

    const categoryData = [
        { name: 'Technology', description: 'The latest in tech, software, and digital innovation' },
        { name: 'Tutorials', description: 'Step-by-step guides and how-to articles' },
        { name: 'Business', description: 'Strategy, growth, and entrepreneurship insights' },
        { name: 'Design', description: 'UI/UX, branding, and creative inspiration' },
        { name: 'News', description: 'Updates, announcements, and industry news' },
    ];

    const categories = await Promise.all(
        categoryData.map(c =>
            prisma.category.create({ data: { name: c.name, slug: slug(c.name), description: c.description } })
        )
    );

    const tagNames = ['javascript', 'typescript', 'nodejs', 'react', 'nextjs', 'cms', 'webdev', 'design', 'seo', 'performance'];
    const tags = await Promise.all(
        tagNames.map(t => prisma.tag.create({ data: { name: t, slug: t } }))
    );

    console.log(`  ✓ ${categories.length} categories, ${tags.length} tags`);

    // ── 6. Blog Posts ──────────────────────────────────────────────────────────
    console.log('\n[6/13] Blog posts...');

    const postData = [
        // Published posts
        {
            title: 'Getting Started with Mero CMS',
            excerpt: 'Learn how to install, configure, and launch your first Mero CMS site in under 10 minutes.',
            content: `<h2>What is Mero CMS?</h2><p>Mero CMS is a self-hosted content management system built for developers and content teams who need flexibility without complexity. It ships with a full-featured REST API, a Next.js admin dashboard, and a powerful theme system.</p><h2>Prerequisites</h2><ul><li>Node.js 20+</li><li>PostgreSQL 14+</li><li>A domain name (optional for local development)</li></ul><h2>Installation</h2><p>Clone the repository and install dependencies:</p><pre><code>git clone https://github.com/blendwit/mero-cms\ncd mero-cms\nnpm install</code></pre><h2>Configuration</h2><p>Copy the environment template and fill in your database credentials:</p><pre><code>cp .env.example .env</code></pre><p>Open .env and set your DATABASE_URL, JWT_SECRET, and FRONTEND_URL.</p><h2>Running the Setup Wizard</h2><p>Start the backend and open http://localhost:3001 in your browser. The setup wizard will guide you through creating your first admin account and enabling the modules you need.</p><h2>Next Steps</h2><p>Once setup is complete, install a theme from the Themes panel and start creating content. The REST API is fully documented at /api/docs.</p>`,
            status: 'PUBLISHED',
            featured: true,
            authorId: adminUser.id,
            publishedAt: daysAgo(14),
            catIndex: 1,
            tagIndices: [5, 6, 2],
        },
        {
            title: 'Understanding the Collections Module',
            excerpt: 'Collections let you define custom content types without writing any code. Here is everything you need to know.',
            content: `<h2>What Are Collections?</h2><p>Collections are user-defined content schemas — think of them as custom database tables you can create through the admin UI. A "Products" collection might have fields for name, price, description, image, and SKU. An "FAQ" collection might have question and answer fields.</p><h2>Creating a Collection</h2><p>Navigate to Collections in the sidebar and click "New Collection". Give it a name, add your fields, and save. Mero CMS will immediately expose a full CRUD API at /collections/your-collection-slug.</p><h2>Field Types</h2><p>Collections support text, number, boolean, date, select, and rich text field types. You can mark fields as required, set default values, and add descriptions.</p><h2>Querying from Your Theme</h2><p>Use the public API endpoint GET /public/collections/your-slug to fetch published items. Add ?search=term for client-side filtering and ?page=1&limit=10 for pagination.</p><h2>Real-World Uses</h2><ul><li>Product catalogs</li><li>Event listings</li><li>Team member directories</li><li>FAQ sections</li><li>Job postings</li></ul>`,
            status: 'PUBLISHED',
            featured: false,
            authorId: adminUser.id,
            publishedAt: daysAgo(10),
            catIndex: 0,
            tagIndices: [5, 6],
        },
        {
            title: 'Building Your First Theme for Mero CMS',
            excerpt: 'A complete walkthrough of the Mero CMS theme system, from theme.json to your first deployed theme.',
            content: `<h2>The Theme System</h2><p>Mero CMS themes are self-contained Next.js applications that consume data from the CMS API. A theme defines its own page layouts, components, and design system — the CMS handles the data layer.</p><h2>theme.json</h2><p>Every theme starts with a theme.json file. This file tells the CMS the theme's name, version, which modules it requires, and the page schema (the editable content structure for each page type).</p><h2>The Page Schema</h2><p>The pageSchema key in theme.json defines the sections and fields editors can configure per page without touching code. Each section has a type, a title, and a list of fields with their labels and default values.</p><h2>Connecting to the API</h2><p>Create a lib/cms.ts file that wraps the CMS API calls. Use getSiteData() to fetch global data (menus, settings, testimonials) and getPage(slug) to fetch page-specific data.</p><h2>Deploying</h2><p>Deploy your theme as a standard Next.js app on Vercel, Netlify, or any hosting that supports Node.js. Set NEXT_PUBLIC_CMS_URL to your CMS backend URL and you are live.</p>`,
            status: 'PUBLISHED',
            featured: false,
            authorId: editorUser.id,
            publishedAt: daysAgo(7),
            catIndex: 1,
            tagIndices: [3, 4, 5],
        },
        {
            title: 'SEO Best Practices for CMS-Powered Sites',
            excerpt: 'How to configure Mero CMS for maximum search engine visibility, from meta tags to sitemaps.',
            content: `<h2>Why CMS SEO Matters</h2><p>Your CMS is the foundation of all published content. Getting the SEO fundamentals right at the CMS level means every piece of content you publish is search-engine ready from day one.</p><h2>Meta Tags</h2><p>Mero CMS has a built-in SEO module that lets you set custom title, description, OG image, and canonical URL for every post, page, and collection item. Access it via the SEO tab in the editor sidebar.</p><h2>Sitemaps</h2><p>Enable the Sitemap module to automatically generate an XML sitemap at /sitemap.xml. The sitemap includes all published posts, pages, and collection items, and updates in real time.</p><h2>Robots.txt</h2><p>The Robots module gives you a live editor for your robots.txt file from the admin UI. No need to redeploy your frontend to update crawl rules.</p><h2>Structured Data</h2><p>For rich results, add JSON-LD structured data in your theme using data from the CMS. Blog posts should use the Article schema, product collections the Product schema.</p>`,
            status: 'PUBLISHED',
            featured: false,
            authorId: editorUser.id,
            publishedAt: daysAgo(5),
            catIndex: 0,
            tagIndices: [8, 6, 9],
        },
        {
            title: 'Webhooks: Automate Your Content Workflow',
            excerpt: 'Use Mero CMS webhooks to trigger builds, send notifications, and integrate with third-party tools.',
            content: `<h2>What Are Webhooks?</h2><p>Webhooks are HTTP callbacks that Mero CMS sends to your configured URLs when specific events occur — post published, page updated, lead captured, and more.</p><h2>Setting Up a Webhook</h2><p>Go to Webhooks in the sidebar. Click "New Webhook" and enter your endpoint URL. Choose which events to subscribe to. Add an optional secret to verify the payload signature.</p><h2>Common Use Cases</h2><ul><li><strong>Trigger Vercel deploys</strong> when a post is published</li><li><strong>Send Slack notifications</strong> when a new lead arrives</li><li><strong>Invalidate CDN cache</strong> when pages are updated</li><li><strong>Sync to a CRM</strong> when form submissions come in</li></ul><h2>Payload Format</h2><p>Every webhook payload includes an event type, a timestamp, and the full resource data (post, lead, etc.) as JSON. The X-Webhook-Secret header contains the HMAC signature for verification.</p>`,
            status: 'PUBLISHED',
            featured: false,
            authorId: adminUser.id,
            publishedAt: daysAgo(3),
            catIndex: 0,
            tagIndices: [2, 6],
        },
        {
            title: 'Managing Your Media Library',
            excerpt: 'Tips and best practices for organising images, videos, and documents in Mero CMS.',
            content: `<h2>The Media Library</h2><p>Mero CMS includes a full media management system. Upload images, PDFs, videos, and other files. Organise them into folders. Reference them from posts, pages, and collection items via their URL.</p><h2>Image Optimisation</h2><p>Mero CMS automatically generates multiple sizes for uploaded images and converts them to WebP format. Reference the optimised URL in your theme using the cmsImageUrl() helper.</p><h2>Folder Organisation</h2><p>Create folders for different content types — blog covers, team photos, product images. Use the folder filter in the media picker to quickly find what you need.</p><h2>Alt Text</h2><p>Set alt text for every image in the media library. Good alt text improves accessibility and SEO. Mero CMS reminds you to add alt text when you upload images without it.</p>`,
            status: 'PUBLISHED',
            featured: false,
            authorId: editorUser.id,
            publishedAt: daysAgo(2),
            catIndex: 3,
            tagIndices: [6, 9],
        },
        {
            title: 'Why Self-Hosted CMS Is Right for Your Business',
            excerpt: 'A breakdown of why owning your CMS infrastructure can save money and give you full control.',
            content: `<h2>The SaaS CMS Tax</h2><p>Most hosted CMS platforms charge per user, per API call, or per bandwidth. As your site grows, so does your bill. A self-hosted CMS is a one-time cost — you pay for your own server, not someone else's margin.</p><h2>Data Ownership</h2><p>With a self-hosted CMS, your content lives in your database. You control backups, migrations, and data residency. You are never one pricing change away from losing access to your content.</p><h2>Customisation Without Limits</h2><p>Self-hosted means you can extend the CMS to fit your workflow exactly. Need a custom module? Add it. Need to integrate with an internal API? Done.</p><h2>The Right Trade-Offs</h2><p>Self-hosting does require some ops knowledge — you manage your server, database, and deployments. For teams with a developer, this is trivial. For non-technical users, managed hosting options can close the gap.</p>`,
            status: 'PUBLISHED',
            featured: false,
            authorId: authorUser.id,
            publishedAt: daysAgo(1),
            catIndex: 2,
            tagIndices: [5, 6],
        },
        {
            title: 'Mero CMS 2.0 Roadmap Preview',
            excerpt: 'A sneak peek at what the team is building for the next major release of Mero CMS.',
            content: `<h2>What Is Coming in 2.0</h2><p>The Mero CMS 2.0 release focuses on three areas: multi-site support, a visual page builder, and a first-party plugin marketplace.</p><h2>Multi-Site Management</h2><p>Manage multiple websites from a single CMS instance. Each site has its own content, settings, and users, but shares one admin login. Perfect for agencies managing multiple client sites.</p><h2>Visual Page Builder</h2><p>A drag-and-drop page builder with live preview. Build pages using your theme's registered sections without writing any code. Compatible with all existing themes via the section schema.</p><h2>Plugin Marketplace</h2><p>First-party and community plugins for e-commerce, membership, newsletter, and more. Install with one click, configure from the admin, done.</p>`,
            status: 'PUBLISHED',
            featured: true,
            authorId: adminUser.id,
            publishedAt: new Date(),
            catIndex: 4,
            tagIndices: [5],
        },
        // Draft posts
        {
            title: 'Integrating Mero CMS with Next.js App Router',
            excerpt: 'A deep dive into using the Mero CMS REST API with Next.js App Router, RSC, and ISR.',
            content: `<h2>Server Components and the CMS API</h2><p>Next.js App Router makes it easy to fetch CMS data directly in server components. No useEffect, no client-side loading states — just async/await in your component.</p><p>[Draft — finishing this weekend]</p>`,
            status: 'DRAFT',
            featured: false,
            authorId: editorUser.id,
            publishedAt: null,
            catIndex: 1,
            tagIndices: [0, 3, 4],
        },
        {
            title: 'A/B Testing Landing Pages with Mero CMS',
            excerpt: 'How to set up simple A/B tests using CMS collections and middleware.',
            content: `<h2>Concept</h2><p>Store two variants as collection items. Use edge middleware to split traffic 50/50 and serve the matching variant slug. Track conversions as leads.</p><p>[Outline — not published yet]</p>`,
            status: 'DRAFT',
            featured: false,
            authorId: authorUser.id,
            publishedAt: null,
            catIndex: 2,
            tagIndices: [3, 8],
        },
        {
            title: 'Performance Tuning: Getting 100 on Lighthouse',
            excerpt: 'Everything we did to take a Mero CMS-powered site from 72 to 100 on all Lighthouse metrics.',
            content: `<h2>Starting Point</h2><p>Our test site scored 72 Performance, 89 Accessibility, 95 Best Practices, 91 SEO. Here is what we changed.</p><p>[In progress — adding screenshots]</p>`,
            status: 'DRAFT',
            featured: false,
            authorId: editorUser.id,
            publishedAt: null,
            catIndex: 0,
            tagIndices: [9, 3],
        },
        // Scheduled posts
        {
            title: 'Announcing Mero CMS Cloud (Early Access)',
            excerpt: 'We are launching a managed cloud hosting option for Mero CMS. No server setup required.',
            content: `<h2>Mero CMS Cloud</h2><p>Starting next month, we are offering managed hosting for Mero CMS. Your CMS, on our infrastructure, with automatic updates, daily backups, and a 99.9% uptime SLA.</p><p>Early access pricing: NPR 1,500/month for up to 3 sites. Sign up at mero-cms.com/cloud.</p>`,
            status: 'SCHEDULED',
            featured: false,
            authorId: adminUser.id,
            publishedAt: daysFromNow(7),
            catIndex: 4,
            tagIndices: [5],
        },
        {
            title: 'New Theme: Nepal Corporate — Free for All Users',
            excerpt: 'We designed a professional corporate theme inspired by Nepal\'s landscape and culture. Now available for free.',
            content: `<h2>Nepal Corporate Theme</h2><p>A clean, professional theme with a warm red and white palette, inspired by the colours of the Nepali flag. Includes a homepage, about, services, team, contact, and blog sections. Fully compatible with all Mero CMS modules.</p>`,
            status: 'SCHEDULED',
            featured: false,
            authorId: adminUser.id,
            publishedAt: daysFromNow(3),
            catIndex: 3,
            tagIndices: [5, 7],
        },
        // More published for volume
        {
            title: 'How to Set Up Multi-Language Content',
            excerpt: 'Using CMS Collections to manage content in Nepali and English side by side.',
            content: `<h2>The Strategy</h2><p>Create two collections — content-en and content-np — with matching slug structures. Your theme detects the browser locale and fetches from the matching collection.</p>`,
            status: 'PUBLISHED',
            featured: false,
            authorId: editorUser.id,
            publishedAt: daysAgo(20),
            catIndex: 1,
            tagIndices: [5, 6],
        },
        {
            title: 'Using the Forms Module for Lead Capture',
            excerpt: 'Build contact forms, quote requests, and newsletter signups — all from the Mero CMS admin.',
            content: `<h2>Creating a Form</h2><p>Go to Forms → New Form. Add fields: text, email, textarea, select, checkbox. Set a success message and notification email. The form is immediately available at /public/forms/your-slug/submit.</p>`,
            status: 'PUBLISHED',
            featured: false,
            authorId: authorUser.id,
            publishedAt: daysAgo(18),
            catIndex: 2,
            tagIndices: [5, 6],
        },
        {
            title: 'Securing Your Mero CMS Installation',
            excerpt: 'Essential security steps every Mero CMS admin should take before going to production.',
            content: `<h2>The Essentials</h2><ul><li>Set a strong JWT_SECRET (min 32 random characters)</li><li>Enable IP whitelisting for admin accounts</li><li>Turn on two-factor authentication</li><li>Configure CORS_ORIGINS to only your domain</li><li>Run behind a reverse proxy (nginx, Caddy) with HTTPS</li></ul>`,
            status: 'PUBLISHED',
            featured: false,
            authorId: adminUser.id,
            publishedAt: daysAgo(16),
            catIndex: 0,
            tagIndices: [6, 2],
        },
        {
            title: 'The Audit Log: Your CMS Change History',
            excerpt: 'Mero CMS logs every admin action. Here\'s how to use the audit log for compliance and debugging.',
            content: `<h2>What Gets Logged</h2><p>Every create, update, and delete action by any admin user is recorded with the user, timestamp, affected resource, and before/after values. The audit log is immutable and supports export to CSV.</p>`,
            status: 'PUBLISHED',
            featured: false,
            authorId: adminUser.id,
            publishedAt: daysAgo(12),
            catIndex: 0,
            tagIndices: [5],
        },
        {
            title: 'Design Principles Behind the Mero CMS Admin',
            excerpt: 'Why we built the admin the way we did — and what we learned about CMS UX along the way.',
            content: `<h2>Speed Over Features</h2><p>We obsessed over page load time in the admin. Every action should complete in under 300ms. Content editors should never wait.</p><h2>Progressive Disclosure</h2><p>Advanced settings are hidden by default. The publish button is always visible. Features reveal themselves as users need them.</p>`,
            status: 'PUBLISHED',
            featured: false,
            authorId: adminUser.id,
            publishedAt: daysAgo(8),
            catIndex: 3,
            tagIndices: [7, 6],
        },
        {
            title: 'API-First Architecture Explained',
            excerpt: 'What API-first means, why it matters for modern web projects, and how Mero CMS embodies it.',
            content: `<h2>Headless vs API-First</h2><p>Headless CMS decouples the admin from the frontend. API-first means the API is the product — the admin is just one consumer of it. Your mobile app, your marketing site, your internal tools can all consume the same CMS API.</p>`,
            status: 'PUBLISHED',
            featured: false,
            authorId: editorUser.id,
            publishedAt: daysAgo(6),
            catIndex: 0,
            tagIndices: [5, 6, 2],
        },
        {
            title: '5 Themes Worth Trying for Your Next Project',
            excerpt: 'A curated list of Mero CMS themes that cover blogging, portfolios, agencies, and e-commerce.',
            content: `<h2>1. Personal Minimal</h2><p>A clean single-column blog theme with support for dark mode, code blocks, and reading time.</p><h2>2. Personal Portfolio</h2><p>Showcase your work with a grid-based portfolio, animated hero, and smooth scroll project pages.</p><h2>3. Org Corporate</h2><p>Professional services template with sections for team, services, testimonials, and contact.</p>`,
            status: 'PUBLISHED',
            featured: false,
            authorId: authorUser.id,
            publishedAt: daysAgo(4),
            catIndex: 3,
            tagIndices: [7, 5],
        },
        {
            title: 'From WordPress to Mero CMS: A Migration Guide',
            excerpt: 'A practical guide for migrating your existing WordPress blog posts and pages to Mero CMS.',
            content: `<h2>Exporting from WordPress</h2><p>Use the WordPress Tools → Export to download an XML file of your posts. Run our migration script to convert it to Mero CMS JSON format and import via the API.</p>`,
            status: 'PUBLISHED',
            featured: false,
            authorId: editorUser.id,
            publishedAt: daysAgo(9),
            catIndex: 1,
            tagIndices: [5, 6],
        },
        {
            title: 'Scheduled Publishing: Plan Your Content Calendar',
            excerpt: 'How to set publish dates in advance and let Mero CMS handle the rest automatically.',
            content: `<h2>Setting a Publish Date</h2><p>In the post editor, open the Publishing panel and click "Schedule". Select your date and time. Save the post as SCHEDULED. Mero CMS checks every minute for posts due to publish and flips them to PUBLISHED automatically.</p>`,
            status: 'PUBLISHED',
            featured: false,
            authorId: authorUser.id,
            publishedAt: daysAgo(11),
            catIndex: 2,
            tagIndices: [5, 6],
        },
    ];

    const posts: { id: string }[] = [];
    for (const p of postData) {
        const post = await prisma.post.create({
            data: {
                title: p.title,
                slug: slug(p.title),
                content: p.content,
                excerpt: p.excerpt,
                status: p.status,
                featured: p.featured,
                authorId: p.authorId,
                publishedAt: p.publishedAt,
                coverImage: `https://picsum.photos/seed/${slug(p.title)}/1200/630`,
                categories: { connect: [{ id: categories[p.catIndex].id }] },
                tags: { connect: p.tagIndices.map(i => ({ id: tags[i].id })) },
            },
        });
        posts.push(post);
    }

    console.log(`  ✓ ${posts.length} posts (${postData.filter(p => p.status === 'PUBLISHED').length} published, ${postData.filter(p => p.status === 'DRAFT').length} draft, ${postData.filter(p => p.status === 'SCHEDULED').length} scheduled)`);

    // ── 7. Static Pages ────────────────────────────────────────────────────────
    console.log('\n[7/13] Pages...');

    const pagesData = [
        {
            title: 'About Us',
            slug: 'about',
            status: 'PUBLISHED',
            description: 'Learn about who we are and what we stand for',
            content: '<h1>About Us</h1><p>We are a team passionate about making content management simple, fast, and developer-friendly.</p>',
        },
        {
            title: 'Contact',
            slug: 'contact',
            status: 'PUBLISHED',
            description: 'Get in touch with our team',
            content: '<h1>Contact Us</h1><p>We would love to hear from you. Use the form below or email us at hello@example.com.</p>',
        },
        {
            title: 'Privacy Policy',
            slug: 'privacy',
            status: 'PUBLISHED',
            description: 'How we collect and use your data',
            content: '<h1>Privacy Policy</h1><p>We respect your privacy. This policy explains what data we collect and why.</p><h2>What We Collect</h2><p>We collect your name, email, and usage data to improve the service.</p>',
        },
    ];

    for (const p of pagesData) {
        await prisma.page.create({ data: p });
    }

    console.log(`  ✓ ${pagesData.length} pages`);

    // ── 8. Collections ─────────────────────────────────────────────────────────
    console.log('\n[8/13] Collections...');

    // Collection 1: Products
    const productsCollection = await prisma.collection.create({
        data: {
            name: 'Products',
            slug: 'products',
            description: 'Sample product catalog demonstrating the Collections module',
            fields: [
                { name: 'name', type: 'text', required: true, label: 'Product Name' },
                { name: 'price', type: 'number', required: true, label: 'Price (NPR)' },
                { name: 'description', type: 'textarea', required: false, label: 'Description' },
                { name: 'category', type: 'select', required: false, label: 'Category', options: ['Software', 'Hardware', 'Service', 'Theme'] },
                { name: 'inStock', type: 'boolean', required: false, label: 'In Stock' },
            ],
        },
    });

    const productItems = [
        { name: 'Mero CMS Basic License', price: 30000, description: 'Full access to Mero CMS with 1 website support, all core modules, and email support.', category: 'Software', inStock: true },
        { name: 'Mero CMS Professional', price: 50000, description: 'Everything in Basic plus AI content generation, priority support, and 3 website licenses.', category: 'Software', inStock: true },
        { name: 'Mero CMS Enterprise', price: 80000, description: 'Unlimited websites, white-label admin, dedicated support, and custom integrations.', category: 'Software', inStock: true },
        { name: 'Personal Minimal Theme', price: 0, description: 'A clean, minimal blog theme for personal websites. Free for all license holders.', category: 'Theme', inStock: true },
        { name: 'Org Corporate Theme', price: 5000, description: 'A professional corporate theme with service listings, team, and testimonials sections.', category: 'Theme', inStock: true },
        { name: 'AI Content Module', price: 15000, description: 'Add AI-powered content generation to any Mero CMS installation. Requires Professional or Enterprise license.', category: 'Software', inStock: true },
        { name: 'Setup & Migration', price: 20000, description: 'Professional setup, server configuration, and migration from your existing CMS.', category: 'Service', inStock: true },
        { name: 'Annual Support Plan', price: 25000, description: 'Priority email and video support, quarterly CMS updates, and performance reviews.', category: 'Service', inStock: true },
        { name: 'Portfolio Theme', price: 3500, description: 'Showcase your creative work with a grid-based portfolio, animated transitions, and project case studies.', category: 'Theme', inStock: true },
        { name: 'E-commerce Extension', price: 45000, description: 'Add product listings, cart, and Khalti/eSewa checkout to any Mero CMS site.', category: 'Software', inStock: false },
    ];

    for (let i = 0; i < productItems.length; i++) {
        const item = productItems[i];
        await prisma.collectionItem.create({
            data: {
                collectionId: productsCollection.id,
                slug: slug(item.name),
                isPublished: true,
                data: item,
            },
        });
    }

    // Collection 2: Projects / Case Studies
    const projectsCollection = await prisma.collection.create({
        data: {
            name: 'Case Studies',
            slug: 'case-studies',
            description: 'Client success stories and project showcases',
            fields: [
                { name: 'title', type: 'text', required: true, label: 'Project Title' },
                { name: 'client', type: 'text', required: true, label: 'Client Name' },
                { name: 'industry', type: 'select', required: false, label: 'Industry', options: ['E-commerce', 'Healthcare', 'Education', 'Finance', 'NGO', 'Media', 'Government'] },
                { name: 'result', type: 'text', required: false, label: 'Key Result' },
                { name: 'description', type: 'textarea', required: false, label: 'Project Description' },
            ],
        },
    });

    const projectItems = [
        { title: 'E-Commerce Platform Rebuild', client: 'Kathmandu Merchants', industry: 'E-commerce', result: '3x increase in conversion rate', description: 'Replaced a legacy WooCommerce site with a Mero CMS-powered storefront with real-time inventory sync.' },
        { title: 'Hospital Information Portal', client: 'Bir Hospital', industry: 'Healthcare', result: 'Reduced enquiry call volume by 60%', description: 'Built a patient information portal with department listings, doctor profiles, and appointment request forms.' },
        { title: 'University Course Catalogue', client: 'Tribhuvan University', industry: 'Education', result: 'Catalogued 1,200 courses in 2 weeks', description: 'Used Collections to create a searchable course catalogue with department filtering and PDF download.' },
        { title: 'NGO Annual Report Site', client: 'Nepal Development Foundation', industry: 'NGO', result: 'Published in 5 days', description: 'Annual report microsite with data visualisations, team profiles, and downloadable PDFs — all managed via CMS.' },
        { title: 'Financial News Portal', client: 'Nepal Finance Daily', industry: 'Finance', result: '200% increase in organic traffic', description: 'A news portal with categories, tags, scheduled publishing, and a custom RSS feed via the Webhooks module.' },
        { title: 'Government Services Directory', client: 'Bagmati Province', industry: 'Government', result: '45,000 monthly visitors', description: 'Citizen-facing service directory with department pages, contact forms, and multilingual content.' },
        { title: 'Online Learning Platform', client: 'Sikshya Nepal', industry: 'Education', result: '800 enrolled students in month 1', description: 'Course listing and enrolment site backed by a Mero CMS Collections schema with lesson tracking.' },
        { title: 'Fashion E-Commerce Launch', client: 'Dhaka House', industry: 'E-commerce', result: 'NPR 4M in first-month sales', description: 'Full product catalogue, size guide, and Khalti payment integration built on the Mero CMS e-commerce extension.' },
        { title: 'Media Company Rebrand', client: 'Himalayan Broadcasting', industry: 'Media', result: 'Site relaunch in 3 weeks', description: 'Migrated 5,000 articles from a legacy CMS to Mero CMS with full SEO redirects and metadata preservation.' },
        { title: 'Microfinance Member Portal', client: 'Community Sewa Bank', industry: 'Finance', result: 'Served 12,000 members online', description: 'Member portal with document library, news, and branch locator. Built on Mero CMS with custom role permissions.' },
    ];

    for (const item of projectItems) {
        await prisma.collectionItem.create({
            data: {
                collectionId: projectsCollection.id,
                slug: slug(item.title),
                isPublished: true,
                data: item,
            },
        });
    }

    // Collection 3: FAQ
    const faqCollection = await prisma.collection.create({
        data: {
            name: 'FAQ',
            slug: 'faq',
            description: 'Frequently asked questions about Mero CMS',
            fields: [
                { name: 'question', type: 'text', required: true, label: 'Question' },
                { name: 'answer', type: 'textarea', required: true, label: 'Answer' },
                { name: 'category', type: 'select', required: false, label: 'Category', options: ['General', 'Pricing', 'Technical', 'Themes', 'Enterprise'] },
                { name: 'order', type: 'number', required: false, label: 'Sort Order' },
            ],
        },
    });

    const faqItems = [
        { question: 'What is Mero CMS?', answer: 'Mero CMS is a self-hosted, API-first content management system built for developers and content teams in Nepal and globally. It includes a NestJS backend API and a Next.js admin dashboard.', category: 'General', order: 1 },
        { question: 'Is Mero CMS open source?', answer: 'The core of Mero CMS is open source under a commercial license. Basic tier is free for personal projects. Professional and Enterprise tiers require a paid license.', category: 'General', order: 2 },
        { question: 'What kind of websites can I build?', answer: 'Any content-driven website: blogs, portfolios, company sites, news portals, e-commerce, NGO sites, government portals, and more. Themes define the frontend design.', category: 'General', order: 3 },
        { question: 'Can I use Mero CMS without a developer?', answer: 'The admin interface is designed to be used by non-technical editors. However, initial setup and theme development do require developer knowledge.', category: 'General', order: 4 },
        { question: 'How is Mero CMS different from WordPress?', answer: 'Mero CMS is API-first and headless — your frontend is a separate Next.js app. This gives you full flexibility over design and performance. WordPress couples the CMS and frontend in one system.', category: 'General', order: 5 },
        { question: 'How much does Mero CMS cost?', answer: 'Licensing is one-time, not a subscription. Basic starts at NPR 30,000, Professional at NPR 50,000, Enterprise from NPR 80,000. All prices are for lifetime use on the licensed domain.', category: 'Pricing', order: 6 },
        { question: 'Is there a free trial?', answer: 'Yes — you can explore the full Mero CMS admin on this demo site for free. The demo resets every 2 hours so you can always experiment safely.', category: 'Pricing', order: 7 },
        { question: 'Do I pay per website?', answer: 'Basic licenses cover 1 website. Professional covers 3 websites. Enterprise is unlimited. Custom pricing is available for agencies with many sites.', category: 'Pricing', order: 8 },
        { question: 'Is there a refund policy?', answer: 'We offer a 30-day money-back guarantee on all license tiers. If Mero CMS does not meet your needs, contact us for a full refund.', category: 'Pricing', order: 9 },
        { question: 'Can I upgrade my license later?', answer: 'Yes. You can upgrade from Basic to Professional or Enterprise at any time by paying the price difference. Your content and configuration are preserved.', category: 'Pricing', order: 10 },
        { question: 'What databases are supported?', answer: 'Mero CMS uses PostgreSQL via Prisma ORM. PostgreSQL 14 or newer is recommended. Managed options like Supabase, Neon, and Railway are fully compatible.', category: 'Technical', order: 11 },
        { question: 'What are the server requirements?', answer: 'Node.js 20+, PostgreSQL 14+, 512MB RAM minimum (1GB recommended), 5GB disk space. Any Linux VPS from NPR 500/month is sufficient for most sites.', category: 'Technical', order: 12 },
        { question: 'Does Mero CMS have a REST API?', answer: 'Yes. The full API is documented at /api/docs on any running instance. Public endpoints (no auth) are under /public/*. Admin endpoints require a JWT token.', category: 'Technical', order: 13 },
        { question: 'Can I deploy with Docker?', answer: 'Yes. The repository includes a production-ready Dockerfile and docker-compose.yml. Run docker compose up to start the full stack.', category: 'Technical', order: 14 },
        { question: 'How do themes work?', answer: 'Themes are separate Next.js applications that consume the Mero CMS API. A theme ships with a theme.json defining its page sections, a CMS SDK for data fetching, and standard Next.js pages.', category: 'Themes', order: 15 },
        { question: 'Can I build my own theme?', answer: 'Absolutely. Create a new Next.js app, add a theme.json, and point it at your CMS backend. The theme documentation covers everything from basic setup to advanced schema extensions.', category: 'Themes', order: 16 },
        { question: 'Does multi-site support exist?', answer: 'Multi-site management is on the Mero CMS 2.0 roadmap. Currently, each CMS instance manages one site. Agencies typically deploy one instance per client.', category: 'Enterprise', order: 17 },
        { question: 'Is SSO (Single Sign-On) supported?', answer: 'SAML and OIDC SSO are planned for the Enterprise tier in version 2.0. Currently, Mero CMS uses JWT-based authentication with optional 2FA.', category: 'Enterprise', order: 18 },
    ];

    for (const item of faqItems) {
        await prisma.collectionItem.create({
            data: {
                collectionId: faqCollection.id,
                slug: slug(item.question),
                isPublished: true,
                data: item,
            },
        });
    }

    // Collection 4: Changelog
    const changelogCollection = await prisma.collection.create({
        data: {
            name: 'Changelog',
            slug: 'changelog',
            description: 'Version history and release notes for Mero CMS',
            fields: [
                { name: 'version', type: 'text', required: true, label: 'Version' },
                { name: 'release_date', type: 'text', required: true, label: 'Release Date' },
                { name: 'title', type: 'text', required: true, label: 'Release Title' },
                { name: 'type', type: 'select', required: false, label: 'Type', options: ['Feature', 'Fix', 'Improvement', 'Breaking'] },
                { name: 'description', type: 'textarea', required: false, label: 'Description' },
            ],
        },
    });

    const changelogItems = [
        { version: '1.3.0', release_date: '2025-04-01', title: 'Licensing, Docker, and CI Pipeline', type: 'Feature', description: 'RSA-signed license system, Docker multi-stage builds, GitHub Actions CI pipeline, Dependabot integration, and the customer onboarding guide.' },
        { version: '1.2.0', release_date: '2025-03-01', title: 'Security Hardening + CMS Packages', type: 'Feature', description: 'IP whitelisting, 2FA via TOTP, audit log, password lockout, session management. Added package system, Khalti/eSewa payments, AI content module, and per-user demo infrastructure.' },
        { version: '1.1.0', release_date: '2025-02-01', title: 'Collections and Webhooks', type: 'Feature', description: 'Custom content collections with full CRUD API, webhook system with HMAC signing, SEO meta module, robots.txt manager, redirect manager, and analytics integration.' },
        { version: '1.0.0', release_date: '2025-01-01', title: 'Initial Release', type: 'Feature', description: 'Core CMS: blogs, pages, menus, media, forms, leads, team, services, testimonials, categories, tags. Setup wizard, role-based access control, theme system, and public API.' },
        { version: '1.3.1', release_date: '2025-04-07', title: 'Bug Fixes and Performance', type: 'Fix', description: 'Fixed media upload size limits, improved public API caching headers, resolved CORS issue with Vercel preview deployments, patched menu item ordering bug.' },
    ];

    for (const item of changelogItems) {
        await prisma.collectionItem.create({
            data: {
                collectionId: changelogCollection.id,
                slug: `v${item.version.replace(/\./g, '-')}`,
                isPublished: true,
                data: item,
            },
        });
    }

    const totalItems = productItems.length + projectItems.length + faqItems.length + changelogItems.length;
    console.log(`  ✓ 4 collections, ${totalItems} items`);

    // ── 9. Forms & Submissions ─────────────────────────────────────────────────
    console.log('\n[9/13] Forms & Submissions...');

    const contactForm = await prisma.form.create({
        data: {
            name: 'Contact Form',
            slug: 'contact',
            description: 'Main contact form for general enquiries',
            fields: [
                { name: 'name', type: 'text', label: 'Your Name', required: true },
                { name: 'email', type: 'email', label: 'Email Address', required: true },
                { name: 'company', type: 'text', label: 'Company', required: false },
                { name: 'subject', type: 'select', label: 'Subject', required: true, options: ['General', 'Sales', 'Support', 'Enterprise'] },
                { name: 'message', type: 'textarea', label: 'Message', required: true },
            ],
            settings: {
                notifyEmail: 'hello@merocms.test',
                successMessage: 'Thank you for your message! We will get back to you within 1 business day.',
            },
        },
    });

    const newsletterForm = await prisma.form.create({
        data: {
            name: 'Newsletter Signup',
            slug: 'newsletter',
            description: 'Email newsletter subscription form',
            fields: [
                { name: 'name', type: 'text', label: 'First Name', required: true },
                { name: 'email', type: 'email', label: 'Email Address', required: true },
                { name: 'interests', type: 'select', label: 'I am interested in', required: false, options: ['CMS Updates', 'Web Development', 'Design', 'Business'] },
            ],
            settings: {
                notifyEmail: 'marketing@merocms.test',
                successMessage: 'You are on the list! Expect our first email within the week.',
            },
        },
    });

    const supportForm = await prisma.form.create({
        data: {
            name: 'Support Request',
            slug: 'support',
            description: 'Technical support ticket form for existing customers',
            fields: [
                { name: 'name', type: 'text', label: 'Your Name', required: true },
                { name: 'email', type: 'email', label: 'Email Address', required: true },
                { name: 'license_key', type: 'text', label: 'License Key', required: false },
                { name: 'category', type: 'select', label: 'Issue Category', required: true, options: ['Installation', 'Theme', 'API', 'Billing', 'Other'] },
                { name: 'priority', type: 'select', label: 'Priority', required: false, options: ['Low', 'Medium', 'High', 'Critical'] },
                { name: 'description', type: 'textarea', label: 'Describe Your Issue', required: true },
            ],
            settings: {
                notifyEmail: 'support@merocms.test',
                successMessage: 'Support ticket submitted. We will respond within 4 business hours for critical issues.',
            },
        },
    });

    // Submissions for contact form
    const contactNames = ['Aarav Sharma', 'Priya Thapa', 'Bikash Rai', 'Sunita Karki', 'Rajesh Adhikari', 'Maya Gurung', 'Dipesh Shrestha', 'Sita Poudel', 'Anish Bhattarai', 'Kriti Limbu'];
    const subjects = ['General', 'Sales', 'Support', 'Enterprise'];
    const companies = ['Yeti Technologies', 'Himalayan Soft', 'Kathmandu Digital', 'Nepal Tech Hub', null, 'CloudNepal', null, 'Sunrise Solutions', null, 'Pragati Pvt Ltd'];

    for (let i = 0; i < 20; i++) {
        const nameIdx = i % contactNames.length;
        await prisma.formSubmission.create({
            data: {
                formId: contactForm.id,
                data: {
                    name: contactNames[nameIdx],
                    email: `${slug(contactNames[nameIdx]).replace(/-/g, '.')}@example.com`,
                    company: companies[nameIdx],
                    subject: pick(subjects),
                    message: pick([
                        'I would like to learn more about your Enterprise plan for our company.',
                        'We are looking for a CMS solution for our e-commerce platform. Can you help?',
                        'How does Mero CMS compare to WordPress for a news portal?',
                        'We need a multilingual site. Does Mero CMS support this?',
                        'Can you provide a custom theme that matches our existing brand?',
                        'What is the setup process like for a non-technical team?',
                        'We are interested in the migration service from our current CMS.',
                        'Can we integrate Khalti payment into a Mero CMS site?',
                    ]),
                },
                ip: `192.168.1.${10 + i}`,
            },
        });
    }

    // Submissions for newsletter
    for (let i = 0; i < 18; i++) {
        const firstName = pick(['Anil', 'Sanjay', 'Ritu', 'Pooja', 'Dev', 'Nisha', 'Ram', 'Gita', 'Kabir', 'Meena']);
        const lastName = pick(['Shrestha', 'Thapa', 'Rai', 'Tamang', 'Gurung', 'Lama', 'Sharma', 'KC', 'Bhattarai']);
        await prisma.formSubmission.create({
            data: {
                formId: newsletterForm.id,
                data: {
                    name: firstName,
                    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@gmail.com`,
                    interests: pick(['CMS Updates', 'Web Development', 'Design', 'Business']),
                },
            },
        });
    }

    // Submissions for support
    const issueCategories = ['Installation', 'Theme', 'API', 'Billing', 'Other'];
    const priorities = ['Low', 'Medium', 'High', 'Critical'];
    for (let i = 0; i < 15; i++) {
        await prisma.formSubmission.create({
            data: {
                formId: supportForm.id,
                data: {
                    name: contactNames[i % contactNames.length],
                    email: `support.user${i}@example.com`,
                    license_key: `MCK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                    category: pick(issueCategories),
                    priority: pick(priorities),
                    description: pick([
                        'Getting a 500 error on media upload for files larger than 10MB.',
                        'The theme active endpoint returns 404 after deploying to a new server.',
                        'How do I configure custom CORS origins in production?',
                        'Need help restoring from a database backup after accidental deletion.',
                        'The scheduled post cron is not firing. Backend logs show no errors.',
                        'Can you extend our license to cover a second domain?',
                        'Setup wizard fails at the database step with a connection timeout.',
                        'Webhook is not firing on post publish. Verified the endpoint is live.',
                    ]),
                },
                ip: `10.0.0.${i + 1}`,
            },
        });
    }

    console.log(`  ✓ 3 forms, 53 submissions`);

    // ── 10. Leads ──────────────────────────────────────────────────────────────
    console.log('\n[10/13] Leads...');

    const leadStatuses = ['NEW', 'NEW', 'NEW', 'CONTACTED', 'CONTACTED', 'CONVERTED'];
    const leadSources = ['website', 'demo', 'referral', 'organic-search', 'social'];
    const leadNames = [
        'Aarav Sharma', 'Priya Thapa', 'Bikash Rai', 'Sunita Karki', 'Rajesh Adhikari',
        'Maya Gurung', 'Dipesh Shrestha', 'Sita Poudel', 'Anish Bhattarai', 'Kriti Limbu',
        'Suresh Joshi', 'Bindu Basnet', 'Nabin Subedi', 'Kabita Pandey', 'Rajan Koirala',
        'Samita Magar', 'Prakash Pandey', 'Laxmi Devi', 'Mohan Thakur', 'Geeta Bhandari',
        'Arjun Giri', 'Puja Dahal', 'Sunil Chaudhary', 'Rekha Maharjan', 'Kiran Hamal',
    ];

    for (let i = 0; i < 52; i++) {
        const name = leadNames[i % leadNames.length];
        const parts = name.split(' ');
        await prisma.lead.create({
            data: {
                name,
                email: `${parts[0].toLowerCase()}.${parts[1].toLowerCase()}${i}@example.com`,
                phone: `98${40000000 + Math.floor(Math.random() * 9999999)}`,
                company: i % 3 === 0 ? pick(['Yeti Tech', 'Himalayan Digital', 'Nepal Soft', 'Sunrise IT', 'CloudNepal']) : null,
                message: pick([
                    'Interested in the Professional package for my company website.',
                    'Looking for a CMS for our news portal. What modules are included?',
                    'Can you demo the Collections module for our product catalogue use case?',
                    'We need a multilingual website. Does Mero CMS support this?',
                    'What is the total cost including setup for a corporate site?',
                    'How long does migration from WordPress take?',
                    null,
                ]),
                source: pick(leadSources),
                status: pick(leadStatuses),
                notes: i % 4 === 0 ? pick(['Called back, interested in Enterprise.', 'Sent pricing PDF.', 'Demo scheduled for next week.', 'Following up in 2 weeks.']) : null,
            },
        });
    }

    console.log(`  ✓ 52 leads`);

    // ── 11. Team, Testimonials, Services ──────────────────────────────────────
    console.log('\n[11/13] Team, Testimonials, Services...');

    const teamMembers = [
        { name: 'Roshan Shrestha', role: 'Founder & CEO', bio: 'Full-stack engineer with 8 years of experience. Built Mero CMS to solve the lack of a quality, Nepal-focused CMS ecosystem.', order: 1 },
        { name: 'Nisha Thapa', role: 'Lead Designer', bio: 'UI/UX designer passionate about creating interfaces that are both beautiful and accessible. Led the Mero CMS admin redesign.', order: 2 },
        { name: 'Bibek Rai', role: 'Backend Engineer', bio: 'NestJS and PostgreSQL specialist. Architect of the Mero CMS API, license system, and webhook infrastructure.', order: 3 },
        { name: 'Priya Adhikari', role: 'Frontend Engineer', bio: 'Next.js developer and open-source contributor. Responsible for the admin dashboard and the marketing theme.', order: 4 },
        { name: 'Sanjay Gurung', role: 'DevOps Engineer', bio: 'Linux, Docker, and CI/CD specialist. Manages the Mero CMS cloud infrastructure and customer deployments.', order: 5 },
        { name: 'Kabita Magar', role: 'Customer Success', bio: 'Helps customers get the most out of Mero CMS. Manages onboarding, documentation, and support processes.', order: 6 },
    ];

    for (const member of teamMembers) {
        await prisma.teamMember.create({
            data: {
                ...member,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&size=256`,
                socialLinks: {
                    linkedin: `https://linkedin.com/in/${slug(member.name)}`,
                    twitter: `https://twitter.com/${slug(member.name).replace(/-/g, '')}`,
                },
                isActive: true,
            },
        });
    }

    const testimonials = [
        { clientName: 'Suresh Joshi', clientRole: 'CTO', clientCompany: 'Yeti Technologies', content: 'We migrated 3 client websites to Mero CMS in a single sprint. The Collections module alone replaced two separate tools we were paying for.', rating: 5, order: 1 },
        { clientName: 'Anita Tamang', clientRole: 'Content Manager', clientCompany: 'Himalayan Media', content: 'Finally a CMS where our editors can do everything without calling a developer. The scheduling feature is a game changer for our news workflow.', rating: 5, order: 2 },
        { clientName: 'Dev Karki', clientRole: 'Founder', clientCompany: 'Kathmandu Startups', content: 'Set up a full startup website in a weekend. The org-corporate theme needed zero modification. Mero CMS is the right tool for Nepal\'s market.', rating: 5, order: 3 },
        { clientName: 'Puja Lama', clientRole: 'Product Manager', clientCompany: 'CloudNepal', content: 'The webhook integration with our build pipeline means our Vercel deploys trigger automatically on every publish. Zero friction for our team.', rating: 4, order: 4 },
        { clientName: 'Rajan Shrestha', clientRole: 'Web Developer', clientCompany: 'Freelancer', content: 'I have built four client sites with Mero CMS this year. The API is well-documented, the admin is fast, and the theme system is exactly what I needed.', rating: 5, order: 5 },
        { clientName: 'Neha Bhattarai', clientRole: 'Marketing Lead', clientCompany: 'Sunrise Solutions', content: 'SEO is baked right in — sitemap, meta tags, robots, OG images. We saw a 40% increase in organic traffic within two months of launching on Mero CMS.', rating: 5, order: 6 },
        { clientName: 'Prashant KC', clientRole: 'IT Director', clientCompany: 'Pragati Group', content: 'Enterprise tier gave us the custom integrations we needed. The Blendwit team was responsive throughout. Solid product and solid support.', rating: 4, order: 7 },
        { clientName: 'Sarita Devi', clientRole: 'NGO Director', clientCompany: 'Nepal Development Foundation', content: 'We are not technical at all, but the Mero CMS admin made it easy to publish our annual report, manage team profiles, and collect donor enquiries.', rating: 5, order: 8 },
    ];

    for (const t of testimonials) {
        await prisma.testimonial.create({
            data: {
                ...t,
                clientAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(t.clientName)}&background=random&size=128`,
                isActive: true,
            },
        });
    }

    const services = [
        { title: 'CMS Setup & Launch', description: 'We configure your Mero CMS instance, set up your database, configure email and DNS, and launch your site. Includes a 1-hour handover call.', icon: 'rocket', order: 1 },
        { title: 'WordPress Migration', description: 'We export your posts, pages, and media from WordPress and import them into Mero CMS with URL redirects, SEO metadata, and images preserved.', icon: 'arrows-right-left', order: 2 },
        { title: 'AI Content Module', description: 'Add AI-powered content generation to your CMS. Write blog posts, generate SEO metadata, and create alt text for images using Claude or GPT.', icon: 'sparkles', order: 3 },
        { title: 'Ongoing Maintenance', description: 'Monthly CMS updates, database backups, uptime monitoring, and priority support. So you focus on content, not infrastructure.', icon: 'wrench-screwdriver', order: 4 },
        { title: 'Training & Onboarding', description: '3-hour video call training session for your content team. We walk through every module your team will use, with a custom written guide delivered after.', icon: 'academic-cap', order: 5 },
    ];

    for (const s of services) {
        await prisma.service.create({ data: { ...s, isActive: true } });
    }

    console.log(`  ✓ ${teamMembers.length} team members, ${testimonials.length} testimonials, ${services.length} services`);

    // ── 12. Menus ──────────────────────────────────────────────────────────────
    console.log('\n[12/13] Menus...');

    const mainMenu = await prisma.menu.create({
        data: { name: 'Main Navigation', slug: 'main-nav' },
    });

    const mainLinks = [
        { label: 'Features', url: '/features', order: 1 },
        { label: 'Pricing', url: '/pricing', order: 2 },
        { label: 'Docs', url: '/docs', order: 3 },
        { label: 'Blog', url: '/blog', order: 4 },
        { label: 'About', url: '/about', order: 5 },
        { label: 'Try Demo', url: '/demo', order: 6 },
    ];

    for (const item of mainLinks) {
        await prisma.menuItem.create({
            data: { ...item, menuId: mainMenu.id, target: item.label === 'Try Demo' ? '_blank' : '_self' },
        });
    }

    const footerMenu = await prisma.menu.create({
        data: { name: 'Footer Links', slug: 'footer' },
    });

    const footerLinks = [
        { label: 'Features', url: '/features', order: 1 },
        { label: 'Pricing', url: '/pricing', order: 2 },
        { label: 'Changelog', url: '/changelog', order: 3 },
        { label: 'Docs', url: '/docs', order: 4 },
        { label: 'Blog', url: '/blog', order: 5 },
        { label: 'FAQ', url: '/faq', order: 6 },
        { label: 'About', url: '/about', order: 7 },
        { label: 'Contact', url: '/contact', order: 8 },
        { label: 'Privacy', url: '/privacy', order: 9 },
    ];

    for (const item of footerLinks) {
        await prisma.menuItem.create({ data: { ...item, menuId: footerMenu.id } });
    }

    const mobileMenu = await prisma.menu.create({
        data: { name: 'Mobile Menu', slug: 'mobile' },
    });

    for (const item of mainLinks) {
        await prisma.menuItem.create({ data: { ...item, menuId: mobileMenu.id } });
    }

    console.log(`  ✓ 3 menus (${mainLinks.length + footerLinks.length + mainLinks.length} items)`);

    // ── 13. Webhooks & Audit Logs ──────────────────────────────────────────────
    console.log('\n[13/13] Webhooks & Audit Log...');

    const webhooks = [
        { name: 'Vercel Deploy Hook', url: 'https://api.vercel.com/v1/integrations/deploy/example-hook-id', events: ['post.published', 'page.updated'], isActive: false },
        { name: 'Slack Notifications', url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX', events: ['lead.created', 'form.submission'], isActive: false },
        { name: 'CRM Sync', url: 'https://crm.example.com/api/webhooks/mero-cms', events: ['lead.created', 'lead.updated'], isActive: false },
        { name: 'CDN Cache Purge', url: 'https://cdn.example.com/purge', events: ['post.published', 'post.updated', 'page.published', 'page.updated'], isActive: false },
        { name: 'Analytics Event', url: 'https://analytics.example.com/collect', events: ['form.submission', 'lead.created'], isActive: false },
    ];

    for (const wh of webhooks) {
        await prisma.webhook.create({
            data: { ...wh, secret: `whs_${Math.random().toString(36).substring(2, 18)}` },
        });
    }

    // Pre-seeded audit log entries for demo realism
    const auditActions = [
        { action: 'post.create', metadata: { title: 'Getting Started with Mero CMS', status: 'PUBLISHED' } },
        { action: 'user.login', metadata: { ip: '203.0.113.10', device: 'Chrome on MacOS' } },
        { action: 'settings.update', metadata: { key: 'primary_color', from: '#1D4ED8', to: '#2563EB' } },
        { action: 'media.upload', metadata: { filename: 'hero-screenshot.png', size: 245600 } },
        { action: 'webhook.create', metadata: { name: 'Vercel Deploy Hook', events: ['post.published'] } },
        { action: 'lead.status_change', metadata: { from: 'NEW', to: 'CONTACTED', leadEmail: 'suresh@example.com' } },
        { action: 'post.update', metadata: { title: 'SEO Best Practices', field: 'status', from: 'DRAFT', to: 'PUBLISHED' } },
        { action: 'user.create', metadata: { email: 'editor@merocms.test', role: 'Editor' } },
        { action: 'collection.create', metadata: { name: 'Products', fields: 5 } },
        { action: 'theme.activate', metadata: { theme: 'mero-pro' } },
        { action: 'form.submission', metadata: { form: 'Contact Form', from: 'anish.bhattarai@example.com' } },
        { action: 'post.delete', metadata: { title: 'Test Post (deleted)', slug: 'test-post' } },
    ];

    for (const entry of auditActions) {
        await prisma.activityLog.create({
            data: {
                userId: adminUser.id,
                action: entry.action,
                metadata: entry.metadata,
                status: 'INFO',
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
            },
        });
    }

    console.log(`  ✓ ${webhooks.length} webhooks (all inactive), ${auditActions.length} audit log entries`);

    // ── Done ───────────────────────────────────────────────────────────────────
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   Demo Seed Complete                 ║');
    console.log('╚══════════════════════════════════════╝');
    console.log('\nDemo accounts (password: demo1234)');
    console.log('  Admin  → admin@merocms.test');
    console.log('  Editor → editor@merocms.test');
    console.log('  Author → author@merocms.test');
    console.log('\nContent summary:');
    console.log(`  ${postData.length} blog posts · ${pagesData.length} pages · 4 collections (${totalItems} items)`);
    console.log(`  ${testimonials.length} testimonials · ${teamMembers.length} team members · ${services.length} services`);
    console.log(`  3 menus · 3 forms (53 submissions) · 52 leads · ${webhooks.length} webhooks`);
}

main()
    .catch((e) => {
        console.error('Seed failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
