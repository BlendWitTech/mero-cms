'use client';

import { useState, useEffect } from 'react';
import {
    BookOpenIcon,
    Cog6ToothIcon,
    PhotoIcon,
    DocumentTextIcon,
    UserGroupIcon,
    ChatBubbleLeftRightIcon,
    EnvelopeIcon,
    GlobeAltIcon,
    ShieldCheckIcon,
    MagnifyingGlassIcon,
    Bars3Icon,
    ChartBarIcon,
    StarIcon,
    KeyIcon,
    ShoppingBagIcon,
    PaintBrushIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    LockClosedIcon,
} from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';

// ─── Types ───────────────────────────────────────────────────────────────────

type SectionDef = { id: string; label: string; icon: any; minTier?: number };

// ─── Section Registry ─────────────────────────────────────────────────────────

const allSections: SectionDef[] = [
    { id: 'getting-started', label: 'Getting Started', icon: BookOpenIcon },
    { id: 'license', label: 'License & Plans', icon: KeyIcon },
    { id: 'theme-setup', label: 'Theme Setup', icon: PaintBrushIcon },
    { id: 'branding', label: 'Branding & Settings', icon: Cog6ToothIcon },
    { id: 'pages', label: 'Pages & Menus', icon: DocumentTextIcon },
    { id: 'blog', label: 'Blog & Content', icon: GlobeAltIcon },
    { id: 'media', label: 'Media Library', icon: PhotoIcon },
    { id: 'team', label: 'Team Members', icon: UserGroupIcon },
    { id: 'services', label: 'Services', icon: StarIcon },
    { id: 'testimonials', label: 'Testimonials', icon: ChatBubbleLeftRightIcon },
    { id: 'leads', label: 'Leads & Forms', icon: EnvelopeIcon },
    { id: 'users', label: 'Users & Roles', icon: ShieldCheckIcon },
    { id: 'seo', label: 'SEO Manager', icon: MagnifyingGlassIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
    { id: 'ecommerce', label: 'E-Commerce', icon: ShoppingBagIcon, minTier: 2 },
    { id: 'email', label: 'Email Setup', icon: EnvelopeIcon },
    { id: 'menus', label: 'Navigation Menus', icon: Bars3Icon },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({ id, icon: Icon, title, subtitle }: { id: string; icon: any; title: string; subtitle: string }) {
    return (
        <div id={id} className="flex items-start gap-4 mb-6 pt-2 scroll-mt-8">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
            </div>
        </div>
    );
}

function Step({ n, text }: { n: number; text: string }) {
    return (
        <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center mt-0.5">{n}</span>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{text}</p>
        </div>
    );
}

function Note({ type = 'info', children }: { type?: 'info' | 'warn' | 'tip'; children: React.ReactNode }) {
    const styles = {
        info: { bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20', icon: InformationCircleIcon, iconCls: 'text-blue-500 dark:text-blue-400' },
        warn: { bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20', icon: ExclamationTriangleIcon, iconCls: 'text-amber-500 dark:text-amber-400' },
        tip: { bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20', icon: CheckCircleIcon, iconCls: 'text-emerald-500 dark:text-emerald-400' },
    }[type];
    const Icon = styles.icon;
    return (
        <div className={`flex gap-3 p-4 rounded-2xl border ${styles.bg} my-4`}>
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.iconCls}`} />
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{children}</p>
        </div>
    );
}

function Card({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-white/[0.06] shadow-sm dark:shadow-none p-6 mb-6">
            {children}
        </div>
    );
}

function TierBadge({ tier }: { tier: number }) {
    const labels: Record<number, { label: string; cls: string }> = {
        2: { label: 'Premium+', cls: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30' },
        3: { label: 'Professional+', cls: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/30' },
        4: { label: 'Enterprise', cls: 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent' },
    };
    const t = labels[tier] ?? labels[2];
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${t.cls}`}>
            <LockClosedIcon className="w-3 h-3" /> {t.label}
        </span>
    );
}

function LockedSection({ tier }: { tier: number }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 dark:border-white/[0.08] rounded-2xl gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center">
                <LockClosedIcon className="w-6 h-6 text-slate-400 dark:text-slate-500" />
            </div>
            <div>
                <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">This section requires a higher plan</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Upgrade to <TierBadge tier={tier} /> to access this documentation and feature.</p>
            </div>
        </div>
    );
}

// ─── Section Content ──────────────────────────────────────────────────────────

function GettingStarted() {
    return (
        <>
            <SectionHeading id="getting-started" icon={BookOpenIcon} title="Getting Started" subtitle="Your CMS is already set up — here's how to start using it." />
            <Card>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-widest text-[10px]">How It Works</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    Blendwit installs and configures Mero CMS for you. Your dashboard is already connected to your website. Everything you do here — from editing text to uploading images — appears live on your site.
                </p>
                <div className="space-y-3 mt-4">
                    <Step n={1} text="Activate your license under Settings → License tab. Paste the JWT token you received after purchase." />
                    <Step n={2} text="Go to Theme to select and activate your purchased website theme." />
                    <Step n={3} text="Fill in your branding details (Settings → Branding) — site name, logo, colors, fonts." />
                    <Step n={4} text="Populate your content — pages, blog posts, team members, services, testimonials." />
                    <Step n={5} text="Configure your email settings so contact forms and notifications work." />
                    <Step n={6} text="Your site goes live. Use this dashboard to manage everything from now on." />
                </div>
            </Card>
            <Note type="tip">You don't need to touch any code. All changes happen through this admin panel and reflect on your website in real time.</Note>
        </>
    );
}

function LicenseSection() {
    return (
        <>
            <SectionHeading id="license" icon={KeyIcon} title="License & Plans" subtitle="Activate your plan and understand what each tier includes." />
            <Card>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-widest text-[10px]">Activating Your License</p>
                <div className="space-y-3">
                    <Step n={1} text="After purchasing a plan on our website, you will receive a license token (a long JWT string starting with eyJ…)." />
                    <Step n={2} text="In this dashboard go to Settings → License tab." />
                    <Step n={3} text="Paste your full token into the Activate License field and click Activate." />
                    <Step n={4} text="Your plan and all its features will activate immediately." />
                </div>
                <Note type="warn">Each license token is one-time use and bound to a single website installation. Do not share it.</Note>
            </Card>
            <Card>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-widest text-[10px]">Plan Comparison</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        { name: 'Basic', features: ['Core CMS features', 'Blog & pages', 'Media library', 'Standard support'] },
                        { name: 'Premium', features: ['Everything in Basic', 'SEO Manager', 'Analytics', 'Priority support'] },
                        { name: 'Professional', features: ['Everything in Premium', 'White-label branding', 'API access', 'AI tools'] },
                        { name: 'Enterprise', features: ['Everything in Professional', 'E-commerce module', 'Unlimited seats', 'Dedicated support'] },
                    ].map(plan => (
                        <div key={plan.name} className="p-4 rounded-xl border border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-3">{plan.name}</p>
                            <ul className="space-y-1.5">
                                {plan.features.map(f => (
                                    <li key={f} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                        <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </Card>
        </>
    );
}

function ThemeSetup() {
    return (
        <>
            <SectionHeading id="theme-setup" icon={PaintBrushIcon} title="Theme Setup" subtitle="Select your theme and make your website live." />
            <Card>
                <div className="space-y-3">
                    <Step n={1} text="Go to Theme in the left sidebar." />
                    <Step n={2} text="You will see all themes available for your plan. Themes are matched to your website type (e.g. business, real estate, e-commerce)." />
                    <Step n={3} text="Click Activate on the theme you purchased. Only one theme can be active at a time." />
                    <Step n={4} text="Enter your website URL in the theme card so the CMS knows which site to connect to." />
                    <Step n={5} text="Go to Settings → Branding and set your logo, colors, and fonts. These apply to the active theme automatically." />
                </div>
            </Card>
            <Note type="info">If your theme shows a preview image that doesn't match, that is just a placeholder. The actual appearance is determined by your branding settings and content.</Note>
            <Card>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-widest text-[10px]">Theme Modules</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Each theme enables specific content modules. For example, a marketing theme typically enables the Testimonials and Team modules. The modules shown in your sidebar are those activated by your current theme. You can manage which optional modules are enabled in Settings → Modules.</p>
            </Card>
        </>
    );
}

function BrandingSection() {
    return (
        <>
            <SectionHeading id="branding" icon={Cog6ToothIcon} title="Branding & Settings" subtitle="Configure your site identity, colors, fonts, and contact details." />
            <Card>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-widest text-[10px]">Branding Tab</p>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <p>• <strong className="text-slate-800 dark:text-slate-200">Site Title</strong> — appears in browser tabs and search results</p>
                    <p>• <strong className="text-slate-800 dark:text-slate-200">Logo</strong> — shown in site header; upload via Media Library</p>
                    <p>• <strong className="text-slate-800 dark:text-slate-200">Favicon</strong> — the small icon in browser tabs</p>
                    <p>• <strong className="text-slate-800 dark:text-slate-200">Primary Color</strong> — used for buttons, accents, and highlights on your site</p>
                    <p>• <strong className="text-slate-800 dark:text-slate-200">Heading / Body Font</strong> — applied across all public pages</p>
                    <p>• <strong className="text-slate-800 dark:text-slate-200">Copyright text</strong> — shown in the footer</p>
                </div>
            </Card>
            <Card>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-widest text-[10px]">Website Tab</p>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <p>• <strong className="text-slate-800 dark:text-slate-200">Contact Email / Phone / Address</strong> — shown in contact sections and footer</p>
                    <p>• <strong className="text-slate-800 dark:text-slate-200">Social Links</strong> — Facebook, Instagram, LinkedIn, YouTube, WhatsApp, TikTok</p>
                    <p>• <strong className="text-slate-800 dark:text-slate-200">Homepage Content</strong> — hero headline, subheading, about section text, CTA button</p>
                </div>
            </Card>
            <Note type="tip">Click Edit Details on any card, make your changes, then click Save. Changes go live on your site immediately.</Note>
        </>
    );
}

function PagesMenus() {
    return (
        <>
            <SectionHeading id="pages" icon={DocumentTextIcon} title="Pages & Site Content" subtitle="Edit your site's static pages and homepage sections." />
            <Card>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-widest text-[10px]">Site Pages</p>
                <div className="space-y-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Site Pages lets you control the content sections of your homepage and other static pages. Use the <strong className="text-slate-800 dark:text-slate-200">Section Editor</strong> to reorder or hide sections (hero, about, services, testimonials, etc.). Use <strong className="text-slate-800 dark:text-slate-200">All Pages</strong> to create additional pages like Privacy Policy or Terms of Service.</p>
                </div>
            </Card>
        </>
    );
}

function BlogSection() {
    return (
        <>
            <SectionHeading id="blog" icon={GlobeAltIcon} title="Blog & Content" subtitle="Create and manage blog posts, categories, and comments." />
            <Card>
                <div className="space-y-3">
                    <Step n={1} text="Go to Blog → All Posts to see your existing posts." />
                    <Step n={2} text="Click New Post or Blog → New Post to create an article." />
                    <Step n={3} text="Fill in the title, content (rich text editor), featured image, category, and SEO fields." />
                    <Step n={4} text="Set status to Published when ready. Draft posts are not visible on your site." />
                    <Step n={5} text="Comments can be managed under Blog → Comments if the module is active." />
                </div>
            </Card>
            <Note type="tip">Use categories to organize your blog. Visitors can filter posts by category on your site.</Note>
        </>
    );
}

function MediaSection() {
    return (
        <>
            <SectionHeading id="media" icon={PhotoIcon} title="Media Library" subtitle="Upload and manage images and files used across your site." />
            <Card>
                <div className="space-y-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400">The Media Library is where all images, documents, and files live. Upload files by dragging them in or clicking Upload. Any image you upload can be used in blog posts, team members, services, and branding settings.</p>
                </div>
            </Card>
            <Note type="info">For best performance, upload images under 2MB. The system supports JPG, PNG, WebP, SVG, and PDF formats. If Cloudinary is configured in Settings → Cloud, files are served from a fast CDN.</Note>
        </>
    );
}

function TeamSection() {
    return (
        <>
            <SectionHeading id="team" icon={UserGroupIcon} title="Team Members" subtitle="Showcase your team on the website." />
            <Card>
                <div className="space-y-3">
                    <Step n={1} text="Go to Content → Team." />
                    <Step n={2} text="Add a team member with their name, role/designation, photo, bio, and social links." />
                    <Step n={3} text="Set their order to control the display sequence on your site." />
                    <Step n={4} text="Toggle visibility to show or hide individual members without deleting them." />
                </div>
            </Card>
        </>
    );
}

function ServicesSection() {
    return (
        <>
            <SectionHeading id="services" icon={StarIcon} title="Services" subtitle="List the services your business offers." />
            <Card>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Navigate to Content → Services and add your service offerings. Each service has a title, description, icon (emoji or image), and can link to a detail page. Services are displayed in a grid on your homepage services section.</p>
            </Card>
        </>
    );
}

function TestimonialsSection() {
    return (
        <>
            <SectionHeading id="testimonials" icon={ChatBubbleLeftRightIcon} title="Testimonials" subtitle="Display client reviews and ratings on your site." />
            <Card>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Go to Content → Testimonials to add client feedback. Each testimonial includes a quote, client name, company, photo, and star rating (1–5). Active testimonials appear in your site's testimonials carousel.</p>
            </Card>
        </>
    );
}

function LeadsSection() {
    return (
        <>
            <SectionHeading id="leads" icon={EnvelopeIcon} title="Leads & Forms" subtitle="Manage contact form submissions from your site visitors." />
            <Card>
                <div className="space-y-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400">When visitors fill your site's contact form, their submission appears here as a Lead. You can view the message, mark it as read/replied, and export leads if needed.</p>
                </div>
            </Card>
            <Note type="tip">Set up email in Settings → Email so you get notified by email each time a new lead arrives.</Note>
        </>
    );
}

function UsersSection() {
    return (
        <>
            <SectionHeading id="users" icon={ShieldCheckIcon} title="Users & Roles" subtitle="Manage who has access to this dashboard and what they can do." />
            <Card>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-widest text-[10px]">Users</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Go to Users → All Users to see everyone with dashboard access. You can invite new team members by email. Each user is assigned a Role that controls their permissions.</p>
            </Card>
            <Card>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-widest text-[10px]">Roles & Permissions</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Roles define what a user can see and do. The default roles are Admin, Editor, and Viewer. Admins can create custom roles and assign specific permissions such as content_edit, media_view, users_view, etc.</p>
            </Card>
            <Note type="warn">Only give Admin role to people you fully trust — Admins can change settings, manage other users, and access all data.</Note>
        </>
    );
}

function SeoSection() {
    return (
        <>
            <SectionHeading id="seo" icon={MagnifyingGlassIcon} title="SEO Manager" subtitle="Control how your pages appear in Google and other search engines." />
            <Card>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">The SEO Manager lets you set meta titles, descriptions, and Open Graph images for each page. Good SEO helps your site rank higher in search results and look great when shared on social media.</p>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <p>• <strong className="text-slate-800 dark:text-slate-200">Meta Title</strong> — the page title shown in Google (keep under 60 characters)</p>
                    <p>• <strong className="text-slate-800 dark:text-slate-200">Meta Description</strong> — the snippet shown below the title in search results (under 160 characters)</p>
                    <p>• <strong className="text-slate-800 dark:text-slate-200">OG Image</strong> — the image shown when your page is shared on WhatsApp, Facebook, etc.</p>
                </div>
            </Card>
        </>
    );
}

function AnalyticsSection() {
    return (
        <>
            <SectionHeading id="analytics" icon={ChartBarIcon} title="Analytics" subtitle="Track your website traffic and visitor behaviour." />
            <Card>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">The Analytics dashboard shows page views, unique visitors, top pages, and traffic over time. Data is collected automatically once the module is active — no external setup required unless you want to add Google Analytics (configured in SEO settings).</p>
            </Card>
        </>
    );
}

function EcommerceSection({ userTier }: { userTier: number }) {
    if (userTier < 2) return <LockedSection tier={2} />;
    return (
        <>
            <SectionHeading id="ecommerce" icon={ShoppingBagIcon} title="E-Commerce" subtitle="Turn your website into a product-selling store." />
            <Card>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-widest text-[10px]">Activating E-Commerce</p>
                <div className="space-y-3">
                    <Step n={1} text="Purchase the E-Commerce add-on package from Blendwit. You will receive an activation token." />
                    <Step n={2} text="Go to Settings → License and activate the add-on token." />
                    <Step n={3} text="Your theme will switch to E-Commerce mode, enabling product listings, cart, and checkout." />
                    <Step n={4} text="Set up your payment gateway (Khalti, eSewa, or Stripe) in the E-Commerce settings." />
                </div>
            </Card>
            <Card>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-widest text-[10px]">Managing Products</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Once activated, a Products section appears in your sidebar. Add products with images, price, stock, categories, and variants. Orders from your site appear in the Orders section and can be marked as processing, shipped, or delivered.</p>
            </Card>
            <Note type="info">The E-Commerce module is compatible with the Mero CMS Shop theme. Contact Blendwit to get the right theme installed for your store.</Note>
        </>
    );
}

function EmailSection() {
    return (
        <>
            <SectionHeading id="email" icon={EnvelopeIcon} title="Email Setup" subtitle="Configure how your site sends emails — lead notifications, invitations, and more." />
            <Card>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-widest text-[10px]">Choosing a Provider</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3">Go to Settings → Email. Choose between <strong className="text-slate-800 dark:text-slate-200">Resend API</strong> (recommended — simple, reliable) or <strong className="text-slate-800 dark:text-slate-200">Direct SMTP</strong> (Gmail, Outlook, or your mail server).</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">For Resend: create a free account at resend.com, verify your domain, and paste the API key here. For SMTP: enter your mail server host, port, username, and password.</p>
            </Card>
            <Note type="warn">Without email configured, contact form notifications and user invitations will not be sent. Set this up early.</Note>
        </>
    );
}

function MenusSection() {
    return (
        <>
            <SectionHeading id="menus" icon={Bars3Icon} title="Navigation Menus" subtitle="Control the links that appear in your site's header and footer navigation." />
            <Card>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Go to Content → Menus. You can create multiple menus (Header, Footer, Mobile). Each menu contains links that you can arrange by drag-and-drop. Links can point to your pages, blog, external URLs, or custom anchor IDs.</p>
            </Card>
            <Note type="tip">Changes to menus take effect immediately on your live site — no cache clearing needed.</Note>
        </>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DocsPage() {
    const [activeSection, setActiveSection] = useState('getting-started');
    const [search, setSearch] = useState('');
    const [userTier, setUserTier] = useState(1);

    useEffect(() => {
        apiRequest('/packages/usage').then((data: any) => {
            setUserTier(data?.package?.tier ?? 1);
        }).catch(() => {});
    }, []);

    const visibleSections = allSections.filter(s => !s.minTier || userTier >= s.minTier || true);
    const filteredSections = visibleSections.filter(s =>
        s.label.toLowerCase().includes(search.toLowerCase())
    );

    const scrollTo = (id: string) => {
        setActiveSection(id);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const renderSection = (id: string) => {
        switch (id) {
            case 'getting-started': return <GettingStarted />;
            case 'license': return <LicenseSection />;
            case 'theme-setup': return <ThemeSetup />;
            case 'branding': return <BrandingSection />;
            case 'pages': return <PagesMenus />;
            case 'blog': return <BlogSection />;
            case 'media': return <MediaSection />;
            case 'team': return <TeamSection />;
            case 'services': return <ServicesSection />;
            case 'testimonials': return <TestimonialsSection />;
            case 'leads': return <LeadsSection />;
            case 'users': return <UsersSection />;
            case 'seo': return <SeoSection />;
            case 'analytics': return <AnalyticsSection />;
            case 'ecommerce': return <EcommerceSection userTier={userTier} />;
            case 'email': return <EmailSection />;
            case 'menus': return <MenusSection />;
            default: return null;
        }
    };

    return (
        <div className="space-y-4 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <PageHeader
                title="Help"
                accent="Docs"
                subtitle="Learn how to use your CMS — from license activation to managing content."
            />

            {/* Mobile tab bar */}
            <div className="xl:hidden sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 -mx-0 px-0 mb-2">
                <div className="flex items-center gap-1.5 overflow-x-auto py-3 px-4 scrollbar-hide">
                    {filteredSections.map(s => (
                        <button
                            key={s.id}
                            onClick={() => scrollTo(s.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all ${
                                activeSection === s.id
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                    : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                            }`}
                        >
                            <s.icon className="w-3.5 h-3.5 flex-shrink-0" />
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-8">
                {/* Sidebar Nav */}
                <aside className="hidden xl:flex flex-col w-56 flex-shrink-0">
                    <div className="sticky top-4 max-h-[calc(100vh-6rem)] overflow-y-auto pb-4">
                        <div className="relative mb-3">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/30"
                            />
                        </div>
                        <nav className="flex flex-col gap-0.5">
                            {filteredSections.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => scrollTo(s.id)}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all text-left ${
                                        activeSection === s.id
                                            ? 'bg-slate-900 dark:bg-white/[0.1] text-white dark:text-white'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    <s.icon className="w-4 h-4 flex-shrink-0 shrink-0" />
                                    <span className="truncate">{s.label}</span>
                                    {s.minTier && userTier < s.minTier && (
                                        <LockClosedIcon className="w-3 h-3 ml-auto text-slate-400 flex-shrink-0" />
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-24 space-y-10">
                    {filteredSections.map(s => (
                        <div key={s.id}>
                            {renderSection(s.id)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
