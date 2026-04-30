/**
 * Documentation articles, keyed by slug-path. The /docs/[...slug]
 * catch-all route uses this to render any of the linked articles.
 *
 * Real-world docs would be MDX files or fetched from a docs system;
 * this is the placeholder content the gallery + dev experience need
 * so no link 404s during development.
 */
export interface DocArticle {
    slug: string; // e.g. "themes/anatomy"
    title: string;
    section: string; // e.g. "Theme system"
    description: string;
    body: string; // simple HTML — rendered via dangerouslySetInnerHTML
}

const ARTICLES: Record<string, DocArticle> = {
    'install': {
        slug: 'install',
        title: 'Install + deploy in 5 minutes',
        section: 'Get started',
        description: 'Get Mero CMS running locally, then deploy it to your platform of choice.',
        body: `
            <h2>Prerequisites</h2>
            <ul>
                <li>Node 20+ and npm</li>
                <li>Postgres 14+ (Mero CMS handles the schema; you provide the database URL)</li>
                <li>Optional: Redis for session storage at scale (defaults to in-memory)</li>
            </ul>
            <h2>Local install</h2>
            <pre><code>npm create mero-cms@latest my-site
cd my-site
npm install
npm run dev</code></pre>
            <p>The dev server starts on port 3000 (theme) and 4000 (admin + API). Open <code>http://localhost:3000</code> to see the marketing theme; <code>http://localhost:3000/admin</code> for the editor.</p>
            <h2>Deploy</h2>
            <p>Mero CMS is a Node app + Postgres database — deploy it anywhere either runs. Recipes for common platforms live under <a href="/docs/ops/deploy">/docs/ops/deploy</a>: Vercel, Fly.io, Railway, AWS ECS, and self-managed Linux.</p>
        `,
    },
    'themes': {
        slug: 'themes',
        title: 'Pick a theme',
        section: 'Get started',
        description: 'Themes are Next.js projects that declare sections via theme.json. Pick one, fork it, or build your own.',
        body: `
            <p>Every Mero CMS theme is a self-contained Next.js project. We ship four reference themes; you can fork any of them or build a new one from scratch.</p>
            <h2>Available themes</h2>
            <ul>
                <li><strong>Mero Pro</strong> — the default, what merocms.com runs on</li>
                <li><strong>Mero Editorial</strong> — magazine + long-form publication</li>
                <li><strong>Mero Studio</strong> — image-led portfolio for design studios</li>
                <li><strong>Mero Docs</strong> — three-pane documentation layout</li>
            </ul>
            <h2>Install a theme</h2>
            <pre><code>mero themes install mero-pro
mero themes activate mero-pro</code></pre>
            <p>Or install via the admin: Settings → Themes → Install from gallery.</p>
        `,
    },
    'domains': {
        slug: 'domains',
        title: 'Connect your domain',
        section: 'Get started',
        description: 'Point a custom domain at your Mero deployment with TLS in under five minutes.',
        body: `
            <p>Mero CMS itself is domain-agnostic — it serves content over whatever hostname your reverse proxy or platform points at it. Connecting a custom domain is a platform-level operation.</p>
            <h2>Vercel + Mero</h2>
            <p>If your theme is hosted on Vercel and your backend on a separate platform, set <code>NEXT_PUBLIC_API_URL</code> on Vercel to your backend URL, then add your custom domain in the Vercel dashboard.</p>
            <h2>Self-hosted</h2>
            <p>Run TLS at your edge (Caddy, Nginx, Traefik, or your cloud&apos;s managed cert). Mero CMS expects to receive requests on the domain you&apos;ve configured — set <code>SITE_HOST</code> in <code>.env</code> to match so the admin redirects work correctly.</p>
        `,
    },
    'team': {
        slug: 'team',
        title: 'Invite your team',
        section: 'Get started',
        description: 'Add editors, set roles, and gate access by capability.',
        body: `
            <p>From the admin: Settings → Team → Invite. You&apos;ll need each invitee&apos;s email; they receive a one-click signup link.</p>
            <h2>Roles</h2>
            <ul>
                <li><strong>Owner</strong> — billing + team + content. Usually the person who set up the workspace.</li>
                <li><strong>Admin</strong> — team + content, no billing</li>
                <li><strong>Editor</strong> — content only</li>
                <li><strong>Author</strong> — drafts only; cannot publish</li>
                <li><strong>Read-only</strong> — viewing + commenting</li>
            </ul>
            <p>Custom roles can be defined under Settings → Roles for Pro and Enterprise tiers.</p>
        `,
    },
    'themes/anatomy': {
        slug: 'themes/anatomy',
        title: 'Anatomy of a theme',
        section: 'Theme system',
        description: 'Every Mero theme has the same shape — here&apos;s a tour.',
        body: `
            <p>A Mero CMS theme is a standard Next.js project plus a <code>theme.json</code> manifest. The manifest declares which sections the theme provides; the admin reads it to render the right edit form for each section.</p>
            <h2>Directory layout</h2>
            <pre><code>my-theme/
├── package.json
├── theme.json
├── public/         # static assets (logos, characters, screenshots)
└── src/
    ├── app/        # Next.js App Router pages
    ├── components/
    │   ├── sections/  # one component per section variant
    │   └── ui/        # shared UI primitives
    └── lib/
        └── api.ts  # CMS client (provided by mero-cms-sdk)</code></pre>
            <h2>Required exports</h2>
            <p>Each section component must export a default React component AND a typed <code>Data</code> interface that matches the field schema in <code>theme.json</code>.</p>
        `,
    },
    'themes/manifest': {
        slug: 'themes/manifest',
        title: 'theme.json reference',
        section: 'Theme system',
        description: 'The manifest schema, field types, and validation rules.',
        body: `
            <p>The <code>theme.json</code> manifest declares which pages and sections your theme supports. The admin uses this to render edit forms; the renderer uses it to map section IDs to React components.</p>
            <h2>Top-level shape</h2>
            <pre><code>{
  "name": "my-theme",
  "version": "1.0.0",
  "displayName": "My Theme",
  "pages": { "home": { ... } },
  "sections": { "Hero": { "fields": [ ... ] } }
}</code></pre>
            <h2>Field types</h2>
            <ul>
                <li><strong>string</strong> — single line text</li>
                <li><strong>text</strong> — multi-line text (textarea)</li>
                <li><strong>json</strong> — structured object/array (rendered as a structured form by the admin)</li>
                <li><strong>image</strong> — media upload from the library</li>
                <li><strong>boolean</strong> — checkbox</li>
                <li><strong>select</strong> — with an <code>options</code> array</li>
            </ul>
        `,
    },
    'themes/variants': {
        slug: 'themes/variants',
        title: 'Section variants',
        section: 'Theme system',
        description: 'Multiple visual treatments of the same section, swappable from the admin.',
        body: `
            <p>A section "variant" is a different visual treatment of the same data shape. The Hero section, for example, ships with three variants: <code>dashboard</code> (default), <code>illustration</code>, and <code>spline</code>. Editors swap between them in the admin without changing copy.</p>
            <p>Declare variants in your section component&apos;s <code>variants</code> export, and the admin will render a variant picker.</p>
        `,
    },
    'themes/fields': {
        slug: 'themes/fields',
        title: 'Custom field types',
        section: 'Theme system',
        description: 'Build your own field types when the built-ins aren&apos;t enough.',
        body: `
            <p>For 95% of cases, the built-in field types (string, text, json, image, boolean, select) are sufficient. When you need richer editing — e.g., a colour picker or a structured array of testimonials — implement a custom field component and register it.</p>
            <p>Custom fields live in <code>src/admin-fields/</code> and export a React component plus a JSON schema. The admin auto-loads anything in that directory.</p>
        `,
    },
    'api/auth': {
        slug: 'api/auth',
        title: 'Authentication',
        section: 'API reference',
        description: 'Session cookies for the admin; API keys for integrations.',
        body: `
            <p>Mero CMS supports two authentication modes:</p>
            <h2>Session cookies (admin + theme)</h2>
            <p>Login via <code>POST /api/auth/login</code> with email + password. The response sets an <code>HttpOnly</code> session cookie scoped to your domain. All admin endpoints require this cookie.</p>
            <h2>API keys (integrations)</h2>
            <p>Create API keys in the admin: Settings → API Keys. Each key has a scope (read, write, admin) and an optional expiry. Pass via the <code>Authorization: Bearer mero_xxx</code> header.</p>
        `,
    },
    'api/sites': {
        slug: 'api/sites',
        title: 'Sites + sections',
        section: 'API reference',
        description: 'Read site metadata and section content.',
        body: `
            <h2>GET /api/sites/:siteId</h2>
            <p>Returns the full site metadata including the page list and section content. Cached for 120s; admins get fresh data automatically when they save.</p>
            <h2>GET /api/sites/:siteId/sections?page=home</h2>
            <p>Returns just the sections for one page, flattened into an array. Cheaper than the full site fetch when you only render one page.</p>
        `,
    },
    'api/webhooks': {
        slug: 'api/webhooks',
        title: 'Webhooks',
        section: 'API reference',
        description: 'HMAC-signed outbound delivery for content events.',
        body: `
            <p>Mero CMS fires webhooks on events you subscribe to: <code>content.published</code>, <code>content.deleted</code>, <code>form.submitted</code>, <code>media.uploaded</code>.</p>
            <h2>HMAC signature</h2>
            <p>Every webhook delivery includes an <code>X-Mero-Signature</code> header containing an HMAC-SHA256 of the body using the shared secret. Verify in your receiver:</p>
            <pre><code>const expected = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(body)
  .digest('hex');
if (header !== expected) reject();</code></pre>
        `,
    },
    'api/capabilities': {
        slug: 'api/capabilities',
        title: 'Capability matrix',
        section: 'API reference',
        description: 'Which features a deployment can use, gated by tier.',
        body: `
            <p>The capability matrix is the source of truth for what a given deployment can do. Theme code can branch on it to hide UI for features the customer hasn&apos;t paid for.</p>
            <pre><code>const caps = await getCapabilities();
if (caps['ai-studio']?.enabled) {
  // render AI Studio button
}</code></pre>
        `,
    },
    'capabilities/visual-editor': {
        slug: 'capabilities/visual-editor',
        title: 'Visual editor',
        section: 'Capabilities',
        description: 'Click-to-edit any block in your published site.',
        body: `
            <p>The visual editor overlays an edit-mode toolbar on your published site. Editors hover over a block, click, and edit copy in place; changes save to draft and publish in 90ms.</p>
            <h2>How it works</h2>
            <p>Each section component declares editable fields. The visual editor reads the manifest at runtime and overlays click targets on each. No per-component opt-in needed for fields that already render plain strings.</p>
            <h2>Tier gating</h2>
            <p>Visual editor is included on Studio and above.</p>
        `,
    },
    'capabilities/ai-studio': {
        slug: 'capabilities/ai-studio',
        title: 'AI Studio',
        section: 'Capabilities',
        description: 'AI-assisted drafts for blog outlines, meta descriptions, alt text, translations.',
        body: `
            <p>AI Studio runs through your prompt library against a foundation model. Drafts are never auto-published; an editor reviews + commits.</p>
            <h2>Default presets</h2>
            <ul>
                <li>Blog outline (5–7 H2 headings + summary paragraphs)</li>
                <li>Meta description (155–160 chars, brand-voice tuned)</li>
                <li>Alt text (descriptive, accessibility-first)</li>
                <li>Translate (preserves markdown + tone)</li>
            </ul>
            <h2>Tier gating</h2>
            <p>Available on Pro and above. Fine-tuning available on Enterprise.</p>
        `,
    },
    'capabilities/forms': {
        slug: 'capabilities/forms',
        title: 'Forms + submissions',
        section: 'Capabilities',
        description: 'Drag-built forms with HMAC delivery and a submissions inbox.',
        body: `
            <p>Build forms in the admin, drop them into any page via the Forms section variant, receive submissions in the inbox or via webhook.</p>
            <h2>Default fields</h2>
            <p>Text, email, textarea, select, checkbox, file. Custom fields available on Pro+.</p>
            <h2>Tier gating</h2>
            <p>Available on Studio and above. Limited to 100 submissions/month on Studio; unlimited on Pro+.</p>
        `,
    },
    'capabilities/white-label': {
        slug: 'capabilities/white-label',
        title: 'White-label admin',
        section: 'Capabilities',
        description: 'Replace the Mero CMS branding in the admin with your own.',
        body: `
            <p>White-label mode lets you ship Mero CMS to your customers with your own logo, colours, and admin URL. The admin still does everything Mero does — it just looks like yours.</p>
            <h2>What you can change</h2>
            <ul>
                <li>Logo (svg or png)</li>
                <li>Brand color (one primary; navy/grey kept for UI affordances)</li>
                <li>Admin URL (e.g. admin.yourbrand.com instead of admin.merocms.com)</li>
                <li>"Powered by Mero CMS" footer hidden on Pro+</li>
            </ul>
            <h2>Tier gating</h2>
            <p>White-label is available on Pro and Enterprise.</p>
        `,
    },
    'ops/backup': {
        slug: 'ops/backup',
        title: 'Backup + restore',
        section: 'Operations',
        description: 'Automated database snapshots, media backups, and restore drills.',
        body: `
            <p>Mero CMS doesn&apos;t do backups for you — it&apos;s your infrastructure. But it makes them easy.</p>
            <h2>Database</h2>
            <p>Schedule <code>pg_dump</code> against your Postgres instance via your platform&apos;s cron. Daily snapshots are usually sufficient; high-traffic deployments should run them every 4 hours.</p>
            <h2>Media</h2>
            <p>If you use S3-compatible storage (recommended), enable bucket versioning + cross-region replication. Both are 1-line changes in your provider config.</p>
            <h2>Restore drill</h2>
            <p>We recommend running a quarterly restore drill: spin up a staging deployment from yesterday&apos;s backup, confirm the admin loads + the theme renders.</p>
        `,
    },
    'ops/deploy': {
        slug: 'ops/deploy',
        title: 'Deployment recipes',
        section: 'Operations',
        description: 'Verified deployment configs for Vercel, Fly.io, Railway, AWS ECS, and self-hosted Linux.',
        body: `
            <p>Mero CMS is a Node app + Postgres database — deploy it anywhere both run. Recipes below are tested as of v1.5.</p>
            <h2>Vercel (theme) + Fly.io (backend)</h2>
            <p>Most common combo. Theme runs on Vercel for ISR + edge caching; backend on Fly for the long-running Node process and Postgres.</p>
            <h2>Railway (single platform)</h2>
            <p>Easiest path for small deployments. Both theme and backend run on Railway; database too. ~$15/month for a small workspace.</p>
            <h2>AWS ECS + RDS</h2>
            <p>For enterprise deployments with strict compliance needs. Backend in ECS Fargate, Postgres in RDS, media in S3.</p>
            <h2>Self-hosted Linux</h2>
            <p>Single VPS with PM2 + Nginx + Postgres. ~$10/month, fits any small-team workspace. Recipe in the repo at <code>deploy/single-vps</code>.</p>
        `,
    },
    'ops/monitoring': {
        slug: 'ops/monitoring',
        title: 'Monitoring + alerts',
        section: 'Operations',
        description: 'What to monitor, what to alert on, and how to wire it up.',
        body: `
            <h2>What to monitor</h2>
            <ul>
                <li>Backend HTTP error rate (alert at 1% over 5 min)</li>
                <li>Backend p99 latency (alert at 1s)</li>
                <li>Postgres connection saturation</li>
                <li>Disk space on the media volume</li>
                <li>Webhook delivery failures</li>
            </ul>
            <h2>Recipes</h2>
            <p>Mero CMS exposes a <code>/api/health</code> endpoint with structured JSON. Wire it up to whatever monitoring you already use (Datadog, Grafana, Better Stack, UptimeRobot).</p>
        `,
    },
    'ops/scale': {
        slug: 'ops/scale',
        title: 'Scaling beyond a single node',
        section: 'Operations',
        description: 'When and how to add more backend nodes.',
        body: `
            <p>A single Mero CMS backend node serves ~5,000 admin sessions per minute and ~10,000 theme requests per second (most theme requests are ISR-cached at the edge anyway).</p>
            <p>If you outgrow that:</p>
            <ul>
                <li>Add a Redis instance and set <code>SESSION_BACKEND=redis</code> — sessions move out of memory</li>
                <li>Run multiple backend nodes behind your load balancer</li>
                <li>Move media to S3-compatible storage if you haven&apos;t already</li>
                <li>Add a read replica for the Postgres for theme reads</li>
            </ul>
        `,
    },
    'recipes/migrate-wp': {
        slug: 'recipes/migrate-wp',
        title: 'Migrate from WordPress',
        section: 'How-to recipes',
        description: 'Move posts, pages, media, and users into Mero CMS.',
        body: `
            <p>The <code>mero migrate wp</code> CLI command takes a WordPress export file and converts it to Mero CMS sections. Posts become blog posts; pages become section-based pages using a default theme.</p>
            <pre><code>mero migrate wp ./wordpress.xml --target=my-site</code></pre>
            <p>Media is preserved with original URLs; users are imported with editor role + an email-link to set their password.</p>
        `,
    },
    'recipes/i18n': {
        slug: 'recipes/i18n',
        title: 'Run a multi-language site',
        section: 'How-to recipes',
        description: 'First-class language columns on every content type, fallback chains, AI translation.',
        body: `
            <p>Multilingual support is built into the content model: every string field can be authored per-locale. The admin renders a tab strip for each enabled locale.</p>
            <h2>Routing</h2>
            <p>The default theme uses path-based routing: <code>/en/about</code>, <code>/fr/about</code>. Configure enabled locales in <code>theme.json</code>.</p>
            <h2>AI translation</h2>
            <p>AI Studio&apos;s <code>translate</code> preset takes the source-language content and produces a draft in the target locale. An editor reviews + commits.</p>
        `,
    },
    'recipes/embed': {
        slug: 'recipes/embed',
        title: 'Embed Mero CMS in another app',
        section: 'How-to recipes',
        description: 'Use Mero CMS as the content backend for a mobile app or another web app.',
        body: `
            <p>Mero CMS is "headless-ish" — the REST API exposes everything the theme uses. To embed in another app:</p>
            <ol>
                <li>Create an API key in the admin (Settings → API Keys → New)</li>
                <li>Use the public read endpoints (<code>GET /api/sites/:siteId</code>) to fetch content</li>
                <li>For authenticated reads, pass the API key as a Bearer token</li>
            </ol>
            <p>The official SDK at <code>@merocms/sdk</code> wraps these endpoints with typed methods.</p>
        `,
    },
    'recipes/k8s': {
        slug: 'recipes/k8s',
        title: 'Run on Kubernetes',
        section: 'How-to recipes',
        description: 'Helm chart + recommended manifests for production K8s deployments.',
        body: `
            <p>The official Helm chart at <code>github.com/merocms/charts/mero-cms</code> ships with sensible defaults and supports horizontal scaling, Postgres operator integration, and PVC-backed media.</p>
            <pre><code>helm repo add mero https://charts.merocms.com
helm install mero mero/mero-cms \\
  --set postgres.host=&lt;your-host&gt; \\
  --set ingress.host=admin.example.com</code></pre>
            <p>Production checklist + multi-region recipes in the chart README.</p>
        `,
    },
};

export function getDocArticle(slugPath: string): DocArticle | null {
    return ARTICLES[slugPath] || null;
}
export function listDocArticles(): DocArticle[] {
    return Object.values(ARTICLES);
}
