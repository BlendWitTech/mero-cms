/**
 * Mero CMS Client Library — Marketing Theme
 * Full typed client + submitLead() for contact forms.
 */

const CMS_API_URL = process.env.CMS_API_URL || 'http://localhost:3001';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface SiteSettings {
  siteTitle: string;
  tagline: string;
  siteUrl: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  copyright: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    github?: string;
  };
  logoUrl: string | null;
  faviconUrl: string | null;
}

export interface MenuItem {
  id: string;
  label: string;
  url: string;
  target: '_self' | '_blank';
  order: number;
  children?: MenuItem[];
}

export interface Menu {
  id: string;
  name: string;
  slug: string;
  items: MenuItem[];
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  status: 'draft' | 'published' | 'archived';
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string; email: string };
  categories: Category[];
  tags: Tag[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  featuredImage: string | null;
  clientName: string | null;
  projectUrl: string | null;
  completedAt: string | null;
  status: string;
  category: ProjectCategory | null;
  technologies: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCategory {
  id: string;
  name: string;
  slug: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photo: string | null;
  email: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  githubUrl: string | null;
  order: number;
}

export interface Testimonial {
  id: string;
  clientName: string;
  clientRole: string | null;
  clientCompany: string | null;
  clientPhoto: string | null;
  content: string;
  rating: number | null;
  order: number;
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  icon: string | null;
  featuredImage: string | null;
  order: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  order: number;
}

export interface SeoMeta {
  title: string | null;
  description: string | null;
  keywords: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
}

export interface SiteData {
  settings: SiteSettings;
  enabledModules: string[];
  menus: Menu[];
  pages: Page[];
  projects: Project[];
  team: TeamMember[];
  testimonials: Testimonial[];
  services: Service[];
  milestones: Milestone[];
  recentPosts: Post[];
}

export interface PostListResponse {
  posts: Post[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Fetch Helper ──────────────────────────────────────────────────────────

async function cmsGet<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${CMS_API_URL}${path}`, {
    next: { revalidate },
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`CMS fetch failed: ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

// ─── Site Data ─────────────────────────────────────────────────────────────

export async function getSiteData(revalidate = 60): Promise<SiteData> {
  return cmsGet<SiteData>('/public/site-data', revalidate);
}

export async function getMenu(slug: string, revalidate = 60): Promise<Menu | null> {
  try { return await cmsGet<Menu>(`/menus/${slug}`, revalidate); }
  catch { return null; }
}

// ─── Blog ──────────────────────────────────────────────────────────────────

export async function getPublishedPosts(
  options: { page?: number; limit?: number; category?: string } = {},
  revalidate = 60
): Promise<PostListResponse> {
  const { page = 1, limit = 10, category } = options;
  const params = new URLSearchParams({ page: String(page), limit: String(limit), status: 'published' });
  if (category) params.set('category', category);
  return cmsGet<PostListResponse>(`/posts/public?${params}`, revalidate);
}

export async function getPostBySlug(slug: string, revalidate = 60): Promise<Post | null> {
  try { return await cmsGet<Post>(`/posts/public/${slug}`, revalidate); }
  catch { return null; }
}

// ─── Testimonials ──────────────────────────────────────────────────────────

export async function getTestimonials(revalidate = 300): Promise<Testimonial[]> {
  try { return await cmsGet<Testimonial[]>('/testimonials/public', revalidate); }
  catch { return []; }
}

// ─── Services ──────────────────────────────────────────────────────────────

export async function getServices(revalidate = 300): Promise<Service[]> {
  try { return await cmsGet<Service[]>('/services/public', revalidate); }
  catch { return []; }
}

// ─── Pages ─────────────────────────────────────────────────────────────────

export async function getPageBySlug(slug: string, revalidate = 60): Promise<Page | null> {
  try { return await cmsGet<Page>(`/pages/public/${slug}`, revalidate); }
  catch { return null; }
}

// ─── SEO ───────────────────────────────────────────────────────────────────

export async function getSeoMeta(route: string, revalidate = 300): Promise<SeoMeta | null> {
  try {
    return await cmsGet<SeoMeta>(`/seo-meta/public?route=${encodeURIComponent(route)}`, revalidate);
  } catch { return null; }
}

// ─── Leads (Contact Form) ──────────────────────────────────────────────────

export interface LeadSubmission {
  name: string;
  email: string;
  company?: string;
  message: string;
  source?: string;
}

export interface LeadResponse {
  success: boolean;
  message: string;
}

/**
 * Submit a contact form lead to the CMS.
 * Calls POST /leads/public/submit (no auth required).
 */
export async function submitLead(data: LeadSubmission): Promise<LeadResponse> {
  try {
    const res = await fetch(`${CMS_API_URL}/leads/public/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, source: data.source || 'marketing-site' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, message: (err as any).message || 'Something went wrong. Please try again.' };
    }
    return { success: true, message: 'Thanks! We\'ll be in touch shortly.' };
  } catch {
    return { success: false, message: 'Could not reach the server. Please try again later.' };
  }
}

// ─── Image Helper ──────────────────────────────────────────────────────────

export function cmsImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${CMS_API_URL}${path}`;
}
