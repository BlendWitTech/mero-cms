'use client';

import { useState } from 'react';
import {
    BookOpenIcon,
    Cog6ToothIcon,
    PhotoIcon,
    DocumentTextIcon,
    MapPinIcon,
    UserGroupIcon,
    ChatBubbleLeftRightIcon,
    EnvelopeIcon,
    GlobeAltIcon,
    SwatchIcon,
    ShieldCheckIcon,
    MagnifyingGlassIcon,
    Bars3Icon,
    ChartBarIcon,
    BellAlertIcon,
    ServerStackIcon,
    ArrowRightIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    StarIcon,
} from '@heroicons/react/24/outline';

// ─── Section Data ─────────────────────────────────────────────────────────────

const sections = [
    { id: 'overview', label: 'Overview', icon: BookOpenIcon },
    { id: 'plots', label: 'Plots', icon: MapPinIcon },
    { id: 'blog', label: 'Blog', icon: DocumentTextIcon },
    { id: 'services', label: 'Services', icon: StarIcon },
    { id: 'team', label: 'Team', icon: UserGroupIcon },
    { id: 'testimonials', label: 'Testimonials', icon: ChatBubbleLeftRightIcon },
    { id: 'leads', label: 'Leads', icon: EnvelopeIcon },
    { id: 'comments', label: 'Comments', icon: ChatBubbleLeftRightIcon },
    { id: 'media', label: 'Media Library', icon: PhotoIcon },
    { id: 'menus', label: 'Menus', icon: Bars3Icon },
    { id: 'pages', label: 'Pages', icon: DocumentTextIcon },
    { id: 'users', label: 'Users & Roles', icon: UserGroupIcon },
    { id: 'settings', label: 'Settings', icon: Cog6ToothIcon },
    { id: 'email', label: 'Email', icon: EnvelopeIcon },
    { id: 'seo', label: 'SEO', icon: MagnifyingGlassIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
    { id: 'themes', label: 'Themes', icon: SwatchIcon },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({ id, icon: Icon, title, subtitle }: { id: string; icon: any; title: string; subtitle: string }) {
    return (
        <div id={id} className="flex items-start gap-4 mb-6 pt-2 scroll-mt-8">
            <div className="w-11 h-11 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-violet-600" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
            </div>
        </div>
    );
}

function Step({ n, text }: { n: number; text: string }) {
    return (
        <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">{n}</span>
            <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
        </div>
    );
}

function Note({ type = 'info', children }: { type?: 'info' | 'warn' | 'tip'; children: React.ReactNode }) {
    const styles = {
        info: { bg: 'bg-blue-50 border-blue-200', icon: InformationCircleIcon, iconCls: 'text-blue-500' },
        warn: { bg: 'bg-amber-50 border-amber-200', icon: ExclamationTriangleIcon, iconCls: 'text-amber-500' },
        tip: { bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircleIcon, iconCls: 'text-emerald-500' },
    }[type];
    const Icon = styles.icon;
    return (
        <div className={`flex gap-3 p-4 rounded-2xl border ${styles.bg} my-4`}>
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.iconCls}`} />
            <p className="text-sm text-slate-700 leading-relaxed">{children}</p>
        </div>
    );
}

function Field({ name, desc }: { name: string; desc: string }) {
    return (
        <div className="flex gap-3 py-2 border-b border-slate-100 last:border-0">
            <code className="text-xs bg-slate-100 text-violet-700 px-2 py-1 rounded-lg font-mono flex-shrink-0 self-start">{name}</code>
            <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
        </div>
    );
}

function Card({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-8">
            {children}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DocsPage() {
    const [activeSection, setActiveSection] = useState('overview');
    const [search, setSearch] = useState('');

    const filteredSections = sections.filter(s =>
        s.label.toLowerCase().includes(search.toLowerCase())
    );

    const scrollTo = (id: string) => {
        setActiveSection(id);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="max-w-[1400px] mx-auto">
            {/* Mobile / Tablet sticky horizontal tab bar */}
            <div className="xl:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 -mx-8 px-4 mb-6">
                <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-hide">
                    {sections.map(s => (
                        <button
                            key={s.id}
                            onClick={() => scrollTo(s.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all ${
                                activeSection === s.id
                                    ? 'bg-violet-600 text-white'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
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
            <aside className="hidden xl:flex flex-col w-60 flex-shrink-0">
                <div className="sticky top-0 max-h-screen overflow-y-auto pb-4">
                    <div className="relative mb-4">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search docs…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400"
                        />
                    </div>
                    <nav className="flex flex-col gap-0.5">
                        {filteredSections.map(s => (
                            <button
                                key={s.id}
                                onClick={() => scrollTo(s.id)}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all text-left ${
                                    activeSection === s.id
                                        ? 'bg-violet-600 text-white'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <s.icon className="w-4 h-4 flex-shrink-0" />
                                {s.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-24">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                            <BookOpenIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900">CMS Documentation</h1>
                            <p className="text-slate-500 text-sm mt-0.5">KTM Plots — Complete admin reference guide</p>
                        </div>
                    </div>
                    <div className="h-px bg-gradient-to-r from-violet-200 via-indigo-100 to-transparent mt-6" />
                </div>

                {/* ── Overview ─────────────────────────────────────────── */}
                <Card>
                    <SectionHeading id="overview" icon={BookOpenIcon} title="Overview" subtitle="What this CMS does and how it's structured" />
                    <p className="text-sm text-slate-700 leading-relaxed mb-4">
                        The KTM Plots CMS is a full-stack content management system built with <strong>NestJS</strong> (backend), <strong>Next.js</strong> (admin dashboard), and a <strong>Next.js theme</strong> (public-facing website). It is designed specifically for a land plot real-estate business in the Kathmandu Valley.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        {[
                            { label: 'Backend', desc: 'NestJS API at port 3001. Handles all data, auth, email, and file uploads.' },
                            { label: 'Admin Dashboard', desc: 'Next.js app at port 3000. All content is managed here.' },
                            { label: 'Public Theme', desc: 'Next.js theme at port 3002. The website visitors see.' },
                        ].map(b => (
                            <div key={b.label} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-1">{b.label}</p>
                                <p className="text-sm text-slate-600 leading-relaxed">{b.desc}</p>
                            </div>
                        ))}
                    </div>
                    <Note type="tip">Start all three services at once with <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">npm run dev:all</code> from the project root. This also starts the PostgreSQL database and pgAdmin containers.</Note>
                </Card>

                {/* ── Plots ─────────────────────────────────────────────── */}
                <Card>
                    <SectionHeading id="plots" icon={MapPinIcon} title="Plots" subtitle="Manage land plot listings shown on the website" />
                    <p className="text-sm text-slate-700 leading-relaxed mb-5">
                        Plots are the core product of the site. Each plot has detailed specs, a gallery, categories, and SEO fields. Published plots appear on the <strong>/plots</strong> page and in the Featured Plots section on the homepage.
                    </p>

                    <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-widest">Key Fields</h3>
                    <div className="mb-5">
                        <Field name="Title" desc="The name of the plot listing. Shown as the main heading on the detail page." />
                        <Field name="Slug" desc="URL-friendly identifier. Auto-generated from the title but can be edited. Example: ring-road-plot-1." />
                        <Field name="Status" desc="DRAFT — not visible on the website. PUBLISHED — visible to all visitors. SOLD — still visible but marked as sold." />
                        <Field name="Category" desc="Groups plots (e.g. Residential, Commercial). Categories appear as filters on the /plots page." />
                        <Field name="Featured" desc="Toggle to show this plot in the Featured Plots carousel on the homepage." />
                        <Field name="Price From / To" desc="Price range in NPR. Shown on the listing card and detail page. Leave blank if not disclosing price." />
                        <Field name="Area From / To" desc="Land area range (e.g. 2 Anna – 4 Anna). Shown in the specifications section." />
                        <Field name="Facing" desc="Direction the plot faces (North, South, East, West, etc.)." />
                        <Field name="Road Access" desc="Road width or access type (e.g. 20 ft black-top road)." />
                        <Field name="Location" desc="Human-readable address or locality (e.g. Budhanilkantha, Kathmandu)." />
                        <Field name="Cover Image" desc="Main image shown on listing cards and at the top of the detail page." />
                        <Field name="Gallery" desc="Additional images shown in the image carousel on the detail page." />
                        <Field name="Description" desc="Short description shown on listing cards and the intro paragraph on the detail page." />
                        <Field name="Content" desc="Full rich-text body of the plot detail page." />
                        <Field name="SEO Title / Description" desc="Overrides the page <title> and meta description for this specific plot page." />
                        <Field name="Attributes" desc="Flexible key-value pairs for extra specs (e.g. Water Supply: KUKL, Electricity: NEA)." />
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-widest">How to Add a Plot</h3>
                    <div className="flex flex-col gap-2 mb-4">
                        <Step n={1} text="Go to Dashboard → Plots and click Add New Plot." />
                        <Step n={2} text="Fill in the Title, Description, and Location. The slug auto-generates." />
                        <Step n={3} text="Upload a Cover Image and optionally add Gallery images." />
                        <Step n={4} text="Set Price, Area, Facing, and Road Access in the Specifications section." />
                        <Step n={5} text="Assign a Category and toggle Featured if it should appear on the homepage." />
                        <Step n={6} text="Set Status to PUBLISHED when ready. Save." />
                    </div>
                    <Note type="info">When a hero/cover image is set, the plot detail page shows a centered single-column layout with the image as a full-width hero. Without an image, a two-column layout with a sticky price/contact sidebar is used instead.</Note>
                </Card>

                {/* ── Blog ─────────────────────────────────────────────── */}
                <Card>
                    <SectionHeading id="blog" icon={DocumentTextIcon} title="Blog" subtitle="Write and publish articles that appear on the /blog page" />
                    <p className="text-sm text-slate-700 leading-relaxed mb-5">
                        Blog posts appear in the <strong>Blog Preview</strong> section on the homepage (last 3 posts) and on the <strong>/blog</strong> listing page. Each post has its own detail page at <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">/blog/[slug]</code>.
                    </p>

                    <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-widest">Key Fields</h3>
                    <div className="mb-5">
                        <Field name="Title" desc="Article headline." />
                        <Field name="Slug" desc="URL path for this post. Auto-generated; keep it short and descriptive." />
                        <Field name="Status" desc="DRAFT saves without publishing. PUBLISHED makes it live on the website." />
                        <Field name="Featured" desc="Pins the post to the top of the blog listing page." />
                        <Field name="Cover Image" desc="Displayed as the hero image on the post detail page and as the thumbnail on the listing." />
                        <Field name="Excerpt" desc="Short summary shown on listing cards and used as the meta description if no SEO description is set." />
                        <Field name="Content" desc="Full rich-text body of the article." />
                        <Field name="Categories" desc="Tag the post with one or more categories for filtering." />
                        <Field name="Author" desc="Auto-assigned to the logged-in user. Visible on the post detail page." />
                        <Field name="Published At" desc="Controls the display date. Defaults to now when first published." />
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-widest">Comments & Replies</h3>
                    <p className="text-sm text-slate-700 leading-relaxed mb-3">
                        Every published blog post has a comment section at the bottom. Visitors submit their name, email, and comment. All comments are held in <strong>PENDING</strong> status until approved.
                    </p>
                    <div className="flex flex-col gap-2 mb-4">
                        <Step n={1} text="Go to Dashboard → Blog → Comments to see all pending comments." />
                        <Step n={2} text="When a visitor submits a comment, the admin receives an automatic email notification with a link to review it." />
                        <Step n={3} text="Click Approve to make a comment visible, or Delete to remove it." />
                        <Step n={4} text="Approved comments also support threaded replies from visitors — replies follow the same moderation flow." />
                    </div>
                    <Note type="warn">Both the Blogs and Comments modules must be enabled in Settings → Modules for comments to work. If the Blog or Comments menu is missing from the sidebar, check there first.</Note>
                </Card>

                {/* ── Services ─────────────────────────────────────────── */}
                <Card>
                    <SectionHeading id="services" icon={StarIcon} title="Services" subtitle="Services cards shown on the homepage and /services page" />
                    <p className="text-sm text-slate-700 leading-relaxed mb-5">
                        Services highlight what KTM Plots offers (e.g. Plot Search, Legal Assistance, Documentation). They appear in a grid on the homepage Services section and on the dedicated <strong>/services</strong> page.
                    </p>
                    <div className="mb-4">
                        <Field name="Title" desc="Service name, e.g. Plot Search & Shortlisting." />
                        <Field name="Description" desc="Short explanation shown on the service card." />
                        <Field name="Icon" desc="Click the visual icon picker to choose one of 6 icons that match the theme: Map Pin (location), File/Docs (legal), Eye (site visit), Trending Up (investment), Home (construction), Support (headphones). The selected icon is stored as a slug (e.g. map-pin) and rendered in the red icon box on the website." />
                        <Field name="Order" desc="Controls display order. Lower numbers appear first." />
                        <Field name="Slug" desc="URL slug if the service has a dedicated detail page." />
                    </div>
                    <Note type="tip">Keep descriptions under 100 characters for the best card layout on the homepage grid.</Note>
                </Card>

                {/* ── Team ─────────────────────────────────────────────── */}
                <Card>
                    <SectionHeading id="team" icon={UserGroupIcon} title="Team" subtitle="Team member profiles shown on the About page" />
                    <p className="text-sm text-slate-700 leading-relaxed mb-5">
                        Team members appear in the <strong>Team</strong> section on the <strong>/about</strong> page. Each member has a photo, bio, position, and optional social media links that show as clickable icons.
                    </p>
                    <div className="mb-5">
                        <Field name="Name" desc="Full name of the team member." />
                        <Field name="Position" desc="Job title or role, e.g. Sales Director, Legal Advisor." />
                        <Field name="Bio" desc="Short biography shown below the name and position on the team card." />
                        <Field name="Photo" desc="Profile photo. Displayed as a square image on the team card. Use the Media Picker to select from the library." />
                        <Field name="Order" desc="Controls the display order. Lower numbers appear first." />
                        <Field name="Social Links" desc="Optional links for: Email, Phone, WhatsApp, LinkedIn, Twitter/X, Instagram, Facebook, YouTube. Enter full URLs (or just the number for phone/WhatsApp). Any field left blank will not show an icon." />
                    </div>
                    <Note type="tip">Social icons appear as small clickable icons below the team member's bio on the About page. Hover colour is the theme's brand red (#CC1414).</Note>
                </Card>

                {/* ── Testimonials ─────────────────────────────────────── */}
                <Card>
                    <SectionHeading id="testimonials" icon={ChatBubbleLeftRightIcon} title="Testimonials" subtitle="Client reviews shown in the Testimonials section on the homepage" />
                    <div className="mb-4">
                        <Field name="Client Name" desc="Full name of the client." />
                        <Field name="Client Role" desc="Their role or description, e.g. Property Buyer, Lalitpur." />
                        <Field name="Content" desc="The testimonial text." />
                        <Field name="Rating" desc="Star rating from 1–5. Shown as stars on the homepage carousel." />
                        <Field name="Client Photo" desc="Optional profile photo. If not set, initials are shown." />
                    </div>
                    <Note type="info">Testimonials display in a scrollable carousel on the homepage. All saved testimonials are shown regardless of a draft/publish status.</Note>
                </Card>

                {/* ── Leads ─────────────────────────────────────────────── */}
                <Card>
                    <SectionHeading id="leads" icon={EnvelopeIcon} title="Leads" subtitle="Enquiries submitted through the website contact and plot forms" />
                    <p className="text-sm text-slate-700 leading-relaxed mb-5">
                        Whenever a visitor submits the <strong>Contact form</strong>, the <strong>Enquire button</strong> on a plot page, or the <strong>Request a Site Visit</strong> button, a lead is created here. Leads are read-only in the dashboard — they are for your reference.
                    </p>
                    <div className="mb-4">
                        <Field name="Name / Email / Phone" desc="Contact details provided by the visitor." />
                        <Field name="Message" desc="The message or enquiry text." />
                        <Field name="Origin Page" desc="Which page or form the lead came from (e.g. /plots/ring-road-plot or Contact Page)." />
                        <Field name="Status" desc="NEW → CONTACTED → QUALIFIED → CONVERTED → LOST. Update this as you progress through the sales pipeline." />
                        <Field name="Created At" desc="Timestamp of when the lead was submitted." />
                    </div>
                    <Note type="tip">If SMTP email is configured, new leads trigger a notification email to the site's contact email address automatically.</Note>
                </Card>

                {/* ── Comments ─────────────────────────────────────────── */}
                <Card>
                    <SectionHeading id="comments" icon={ChatBubbleLeftRightIcon} title="Comments" subtitle="Moderate visitor comments on blog posts" />
                    <p className="text-sm text-slate-700 leading-relaxed mb-4">
                        All blog post comments — including replies — flow through this moderation queue. New submissions always arrive with <strong>PENDING</strong> status and are invisible on the website until approved. You can access the comments queue at <strong>Dashboard → Blog → Comments</strong>.
                    </p>
                    <div className="mb-4">
                        <Field name="Author Name / Email" desc="Provided by the commenter. Email is never shown publicly." />
                        <Field name="Content" desc="The comment text." />
                        <Field name="Post" desc="Which blog post this comment belongs to." />
                        <Field name="Parent" desc="If this is a reply, this references the parent comment." />
                        <Field name="Status" desc="PENDING (awaiting review), APPROVED (visible on website), REJECTED (hidden)." />
                    </div>
                    <div className="flex flex-col gap-2 mb-4">
                        <Step n={1} text="Go to Dashboard → Blog → Comments." />
                        <Step n={2} text="When a new comment is submitted, you receive an automatic email notification (requires SMTP to be configured)." />
                        <Step n={3} text="Review the comment content and click Approve to make it public or Delete to remove it permanently." />
                        <Step n={4} text="Replies to comments follow the exact same flow." />
                    </div>
                    <Note type="tip">The notification email includes the commenter's name, the blog post title, the comment text, and a direct link to the Comments dashboard. Configure SMTP in Settings → Email to receive these alerts.</Note>
                </Card>

                {/* ── Media ─────────────────────────────────────────────── */}
                <Card>
                    <SectionHeading id="media" icon={PhotoIcon} title="Media Library" subtitle="Central store for all uploaded images and files" />
                    <p className="text-sm text-slate-700 leading-relaxed mb-4">
                        Every image used in the CMS — plot cover photos, blog cover images, logos, about photos — is stored in the Media Library. Files are served directly from the backend at <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">/uploads/</code>.
                    </p>
                    <div className="flex flex-col gap-2 mb-4">
                        <Step n={1} text="Go to Dashboard → Media. Click Upload or drag-and-drop images." />
                        <Step n={2} text="Supported formats: JPG, PNG, WebP, GIF, SVG, PDF." />
                        <Step n={3} text="Click any image to copy its URL for use in rich-text content." />
                        <Step n={4} text="When adding a Cover Image or Logo in forms, click the image picker icon to browse and select from the library." />
                    </div>
                    <Note type="warn">Deleting a media file from the library does not remove it from content that already references it — but the image will no longer display on the website. Always update content references before deleting.</Note>
                </Card>

                {/* ── Menus ─────────────────────────────────────────────── */}
                <Card>
                    <SectionHeading id="menus" icon={Bars3Icon} title="Menus" subtitle="Control navigation links in the header and footer" />
                    <p className="text-sm text-slate-700 leading-relaxed mb-4">
                        The theme reads two menus by slug: <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">main-nav</code> (header) and <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">footer-links</code> (footer). If a menu with that slug exists, its items are used. If not, default links are shown.
                    </p>
                    <div className="flex flex-col gap-2 mb-4">
                        <Step n={1} text="Go to Dashboard → Menus → New Menu." />
                        <Step n={2} text="Set the Slug to exactly main-nav (header) or footer-links (footer) to connect it to the theme." />
                        <Step n={3} text="Add menu items: each has a Label and a URL (e.g. /plots or https://external.com)." />
                        <Step n={4} text="Set Target to _blank for links that should open in a new tab (e.g. external URLs)." />
                    </div>
                    <Note type="info">If you don't create a main-nav menu, the header shows the default navigation: Home, About, Plots, Services, Blog, Contact.</Note>
                </Card>

                {/* ── Pages ─────────────────────────────────────────────── */}
                <Card>
                    <SectionHeading id="pages" icon={DocumentTextIcon} title="Pages" subtitle="Create static content pages like Privacy Policy or Terms" />
                    <p className="text-sm text-slate-700 leading-relaxed mb-4">
                        Pages are standalone content blocks accessible via their slug (e.g. <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">/privacy</code>). Use them for legal pages, custom landing pages, or any content that doesn't fit blog posts.
                    </p>
                    <div className="mb-4">
                        <Field name="Title" desc="The page heading." />
                        <Field name="Slug" desc="URL path, e.g. privacy-policy → accessible at /privacy-policy." />
                        <Field name="Content" desc="Full rich-text body." />
                        <Field name="Status" desc="DRAFT or PUBLISHED." />
                    </div>
                    <Note type="info">The Site Pages section (under Content) is a separate page-section builder for the main site pages (Home, About, etc.). It controls which sections are visible and their content independently from the Pages module here.</Note>
                </Card>

                {/* ── Users & Roles ─────────────────────────────────────── */}
                <Card>
                    <SectionHeading id="users" icon={UserGroupIcon} title="Users & Roles" subtitle="Manage admin accounts and their permissions" />
                    <p className="text-sm text-slate-700 leading-relaxed mb-5">
                        The CMS uses role-based access control (RBAC). Every user is assigned a role, and each role has a set of permissions that control what they can see and do in the dashboard.
                    </p>

                    <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-widest">Managing Users</h3>
                    <div className="flex flex-col gap-2 mb-5">
                        <Step n={1} text="Go to Dashboard → Users → Invite User." />
                        <Step n={2} text="Enter their name, email, and assign a role. They receive a login link." />
                        <Step n={3} text="You can deactivate (not delete) users to revoke access without losing their activity history." />
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-widest">Managing Roles</h3>
                    <div className="flex flex-col gap-2 mb-4">
                        <Step n={1} text="Go to Dashboard → Roles → Create Role." />
                        <Step n={2} text="Give it a name (e.g. Editor, Viewer) and select its permissions." />
                        <Step n={3} text="Permissions include: view/create/edit/delete for Content, Media, Users, Settings, Leads, and more." />
                        <Step n={4} text="Assign the role to users. Role changes take effect on their next login." />
                    </div>
                    <Note type="warn">There must always be at least one Super Admin account. The system will prevent you from removing the last admin role or deactivating the last admin user.</Note>
                </Card>

                {/* ── Settings ─────────────────────────────────────────── */}
                <Card>
                    <SectionHeading id="settings" icon={Cog6ToothIcon} title="Settings" subtitle="Site identity, branding, contact info, social links, and more" />
                    <p className="text-sm text-slate-700 leading-relaxed mb-5">
                        Settings is divided into tabs. Changes are saved per-section using the <strong>Save</strong> button in each section (not a single global save).
                    </p>

                    <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-widest">Branding & Identity</h3>
                    <div className="mb-5">
                        <Field name="Site Name" desc="The name shown in the browser tab, header logo text, and footer. Also used as the 'from' name in emails." />
                        <Field name="Tagline" desc="Short tagline used in the header and as a default meta description." />
                        <Field name="Logo" desc="Upload a logo image via the Media Picker. Shown in the header. If not set, the Site Name text is shown instead." />
                        <Field name="Favicon" desc="Small icon shown in browser tabs. Should be a square image, ideally 32×32 or 64×64 px." />
                        <Field name="Brand Primary Color" desc="The brand color applied live across the entire website — buttons, header border, active nav links, accents, and more. Defaults to #CC1414 (KTM red). Change this to instantly rebrand the site." />
                        <Field name="Secondary Color" desc="Used for the mobile menu background and dark text/UI elements. Defaults to #1E1E1E (charcoal)." />
                        <Field name="Accent Color" desc="Light background used in select section backgrounds. Defaults to #F4F4F4." />
                        <Field name="Heading Font" desc="Font used for all h1–h6 headings on the website. Choose from: Poppins, Montserrat, Roboto, Nunito, Lato, Playfair Display, Raleway, Open Sans. Leave blank to use the default system font." />
                        <Field name="Body Font" desc="Font used for all body text, paragraphs, and UI elements. Same font options as Heading Font. Leave blank to use the system default." />
                        <Field name="Footer Text / Tagline" desc="Text shown below the site name in the footer brand column. Supports multi-line text." />
                        <Field name="Copyright Text" desc="Shown in the footer bottom bar. Defaults to '© [year] [Site Name]. All rights reserved.' if left blank." />
                        <Field name="Meta Description" desc="Default meta description for pages that don't have their own. Affects how the site appears in Google search results." />
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-widest">Contact Info</h3>
                    <div className="mb-5">
                        <Field name="Contact Email" desc="Shown in the footer Contact section. Also receives new lead notification emails." />
                        <Field name="Contact Phone" desc="Shown in the footer and on the Contact page." />
                        <Field name="Address" desc="Physical office address shown in the footer." />
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-widest">Social Media Links</h3>
                    <p className="text-sm text-slate-700 leading-relaxed mb-3">
                        Enter the full URL for each platform. Supported: <strong>Facebook, Instagram, YouTube, WhatsApp, Twitter/X, LinkedIn, TikTok</strong>. Icons appear in the footer. Leave a field blank to hide its icon.
                    </p>
                    <Note type="info">For WhatsApp, enter just the phone number with country code (e.g. +9779800000000). The CMS automatically builds the wa.me link.</Note>

                    <h3 className="text-sm font-bold text-slate-800 mb-3 mt-5 uppercase tracking-widest">Homepage Sections</h3>
                    <p className="text-sm text-slate-700 leading-relaxed mb-3">
                        These fields let you customise the content of specific sections on the homepage without editing code.
                    </p>
                    <div className="mb-4">
                        <Field name="Hero Title / Subtitle" desc="Override the main headline and sub-text in the Hero banner on the homepage." />
                        <Field name="Hero Background Image / Video" desc="Set a custom background image or video URL for the Hero section." />
                        <Field name="About Title / Content / Image" desc="Override the About section on the homepage." />
                        <Field name="CTA Text / URL" desc="Customise the call-to-action strip button that appears between sections." />
                    </div>
                </Card>

                {/* ── Email ────────────────────────────────────────────── */}
                <Card>
                    <SectionHeading id="email" icon={EnvelopeIcon} title="Email Setup" subtitle="Configure how the CMS sends lead and comment notifications" />
                    <p className="text-sm text-slate-700 leading-relaxed mb-5">
                        The CMS sends automatic email notifications for new leads and new blog comments. Go to <strong>Settings → Email Services</strong> and choose one of two providers.
                    </p>

                    {/* Provider A: Resend */}
                    <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-widest">Provider A — Resend (Recommended)</h3>
                    <p className="text-sm text-slate-700 leading-relaxed mb-3">
                        Resend uses an HTTP API instead of SMTP so it works on all hosting platforms including Railway. Free tier includes 3,000 emails/month.
                    </p>
                    <div className="flex flex-col gap-2 mb-4">
                        <Step n={1} text="Sign up at resend.com → Dashboard → API Keys → Create API Key → copy the key (starts with re_)." />
                        <Step n={2} text="Add and verify your sending domain in Resend → Domains (add the DNS records they give you)." />
                        <Step n={3} text="In Settings → Email Services, select Resend as the provider." />
                        <Step n={4} text="Paste the API key into the Resend API Key field." />
                        <Step n={5} text="Set Sender Email to a verified address on your domain (e.g. noreply@ktmplots.com)." />
                        <Step n={6} text="Save. Submit a test lead from the website to confirm delivery." />
                    </div>
                    <div className="bg-slate-900 rounded-2xl p-4 mb-5 font-mono text-xs text-slate-300 leading-relaxed">
                        <p className="text-slate-500 mb-2"># Resend (alternative to dashboard config)</p>
                        <p>EMAIL_PROVIDER=resend</p>
                        <p>RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx</p>
                        <p>SMTP_FROM=noreply@ktmplots.com</p>
                    </div>
                    <Note type="tip">Resend's free domain <strong>onboarding@resend.dev</strong> works for testing without domain verification — but you must use your own verified domain for production.</Note>

                    {/* Provider B: SMTP / Gmail */}
                    <h3 className="text-sm font-bold text-slate-800 mb-3 mt-6 uppercase tracking-widest">Provider B — SMTP / Gmail</h3>
                    <p className="text-sm text-slate-700 leading-relaxed mb-3">
                        Use any SMTP server. Gmail works with an App Password on port 587. Note: some cloud hosts (e.g. Railway shared plans) block outbound SMTP ports — use Resend in that case.
                    </p>
                    <div className="flex flex-col gap-2 mb-4">
                        <Step n={1} text="In Settings → Email Services, select SMTP / Gmail as the provider." />
                        <Step n={2} text="Enter SMTP Host: smtp.gmail.com for Gmail." />
                        <Step n={3} text="Set Port to 587 and leave Secure (TLS) OFF — Gmail uses STARTTLS on 587." />
                        <Step n={4} text="Enter your Gmail address as the Username." />
                        <Step n={5} text="Enter a Gmail App Password as the Password (see below — NOT your regular password)." />
                        <Step n={6} text="Set Sender Email to your Gmail address." />
                        <Step n={7} text="Save and test by submitting a lead from the website." />
                    </div>
                    <div className="bg-slate-900 rounded-2xl p-4 mb-5 font-mono text-xs text-slate-300 leading-relaxed">
                        <p className="text-slate-500 mb-2"># Gmail SMTP (alternative to dashboard config)</p>
                        <p>EMAIL_PROVIDER=smtp</p>
                        <p>SMTP_HOST=smtp.gmail.com</p>
                        <p>SMTP_PORT=587</p>
                        <p>SMTP_USER=hello@gmail.com</p>
                        <p>SMTP_PASS=abcdefghijklmnop</p>
                        <p>SMTP_FROM=hello@gmail.com</p>
                        <p>SMTP_SECURE=false</p>
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-widest">Gmail — App Password Setup</h3>
                    <div className="flex flex-col gap-2 mb-4">
                        <Step n={1} text="Go to myaccount.google.com → Security." />
                        <Step n={2} text="Enable 2-Step Verification if not already on." />
                        <Step n={3} text="Search for 'App Passwords' and click it." />
                        <Step n={4} text="Select App: Mail → Generate. Copy the 16-character code (paste without spaces)." />
                    </div>
                    <Note type="warn">Never use your regular Gmail password as SMTP_PASS — Google will reject it. You must use an App Password.</Note>
                    <Note type="tip" >Dashboard settings always take priority over environment variables. If both are set, the dashboard values are used.</Note>
                </Card>

                {/* ── SEO ──────────────────────────────────────────────── */}
                <Card>
                    <SectionHeading id="seo" icon={MagnifyingGlassIcon} title="SEO" subtitle="Control how the site appears in search engines" />
                    <p className="text-sm text-slate-700 leading-relaxed mb-5">
                        SEO settings work at three levels — site-wide defaults, per-page overrides, and per-plot/post overrides.
                    </p>

                    <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-widest">Site-Wide SEO</h3>
                    <div className="mb-5">
                        <Field name="Site Name" desc="Appended to every page title as '— KTM Plots'." />
                        <Field name="Meta Description" desc="Set in Settings → Branding. Used as the fallback description for all pages." />
                        <Field name="Robots.txt" desc="Go to Dashboard → SEO → Robots to customise the robots.txt file that tells search engine crawlers what to index." />
                        <Field name="Redirects" desc="Go to Dashboard → SEO → Redirects to set up 301 or 302 redirects from old URLs to new ones." />
                        <Field name="Sitemap" desc="Auto-generated at /sitemap.xml. Includes all published plots, blog posts, and standard pages." />
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-widest">Per-Plot / Per-Post SEO</h3>
                    <p className="text-sm text-slate-700 leading-relaxed mb-3">
                        Each plot and blog post has its own <strong>SEO Title</strong> and <strong>SEO Description</strong> fields. When set, these override the site-wide defaults for that specific page.
                    </p>
                    <Note type="tip">Keep meta descriptions between 120–160 characters for best display in Google search results. Page titles work best at 50–60 characters.</Note>
                </Card>

                {/* ── Analytics ─────────────────────────────────────────── */}
                <Card>
                    <SectionHeading id="analytics" icon={ChartBarIcon} title="Analytics" subtitle="Track page views and visitor activity" />
                    <p className="text-sm text-slate-700 leading-relaxed mb-4">
                        The built-in analytics dashboard shows page view counts collected by the CMS backend. No third-party tracking script is required.
                    </p>
                    <div className="mb-4">
                        <Field name="Total Views" desc="Cumulative page view count across the entire site." />
                        <Field name="Top Pages" desc="Most visited pages, ranked by view count." />
                        <Field name="Recent Activity" desc="Recent admin actions logged in the system (logins, content changes, settings updates)." />
                    </div>
                    <Note type="info">For more detailed analytics (traffic sources, devices, bounce rate), consider adding Google Analytics 4 by pasting your GA4 measurement script tag into the theme's layout.tsx head section.</Note>
                </Card>

                {/* ── Themes ─────────────────────────────────────────────── */}
                <Card>
                    <SectionHeading id="themes" icon={SwatchIcon} title="Themes" subtitle="Manage and switch the active public website theme" />
                    <p className="text-sm text-slate-700 leading-relaxed mb-4">
                        The CMS supports multiple themes. The currently active theme (<strong>ktm-plots</strong>) is a purpose-built Next.js theme for land plot real estate in the Kathmandu Valley.
                    </p>
                    <div className="mb-4">
                        <Field name="Active Theme" desc="The theme currently serving the public website. Only one theme can be active at a time." />
                        <Field name="Page Schema" desc="Defines which sections exist on each page and their configurable fields. Managed by the theme itself." />
                        <Field name="Site Pages" desc="Go to Dashboard → Site Pages to toggle sections on/off and edit their content for each page (Home, About, etc.)." />
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-widest">ktm-plots Theme — Pages & Sections</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                            { page: 'Home (/)', sections: 'Hero, Featured Plots, Services, About, CTA Strip, Testimonials, Blog Preview' },
                            { page: 'About (/about)', sections: 'Hero, Mission, Team, Values, CTA' },
                            { page: 'Plots (/plots)', sections: 'Listing grid with filters by category, search, status' },
                            { page: 'Plot Detail (/plots/[slug])', sections: 'Hero image (or sidebar layout), gallery, specs, enquiry form' },
                            { page: 'Services (/services)', sections: 'Full services listing with icons and descriptions' },
                            { page: 'Blog (/blog)', sections: 'Post grid with pagination' },
                            { page: 'Blog Post (/blog/[slug])', sections: 'Content, tags, author, comments & replies' },
                            { page: 'Contact (/contact)', sections: 'Contact form, map, contact details' },
                        ].map(r => (
                            <div key={r.page} className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                                <p className="text-xs font-bold text-violet-600 mb-1 font-mono">{r.page}</p>
                                <p className="text-xs text-slate-600 leading-relaxed">{r.sections}</p>
                            </div>
                        ))}
                    </div>
                </Card>

            </div>
            </div>
        </div>
    );
}
