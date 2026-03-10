/**
 * Mero CMS Client Library
 * Typed, ISR-ready functions for fetching data from the CMS backend.
 *
 * Set CMS_API_URL in .env.local (default: http://localhost:3001)
 */

const CMS_API_URL = process.env.CMS_API_URL || 'http://localhost:3001';

// ─── TypeScript Interfaces ─────────────────────────────────────────────────

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
  author: {
    id: string;
    name: string;
    email: string;
  };
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

// ─── Fetch Helper ──────────────────────────────────────────────────────────

async function cmsGet<T>(path: string, revalidate = 60): Promise<T> {
  const url = `${CMS_API_URL}${path}`;
  const res = await fetch(url, {
    next: { revalidate },
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`CMS fetch failed: ${url} → ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

// ─── API Functions ─────────────────────────────────────────────────────────

/**
 * Fetch all public site data in a single request.
 * Ideal for layouts and homepages. Revalidates every 60s by default.
 */
export async function getSiteData(revalidate = 60): Promise<SiteData> {
  return cmsGet<SiteData>('/public/site-data', revalidate);
}

/**
 * Fetch a navigation menu by slug (e.g. "main-nav", "footer").
 */
export async function getMenu(slug: string, revalidate = 60): Promise<Menu | null> {
  try {
    return await cmsGet<Menu>(`/menus/${slug}`, revalidate);
  } catch {
    return null;
  }
}

// ── Blog ─────────────────────────────────────────────────────────────────

export interface PostListResponse {
  data: Post[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Fetch published blog posts with optional pagination.
 */
export async function getPublishedPosts(
  options: { page?: number; limit?: number; category?: string } = {},
  revalidate = 60
): Promise<PostListResponse> {
  const { page = 1, limit = 10, category } = options;
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    status: 'published',
  });
  if (category) params.set('category', category);
  return cmsGet<PostListResponse>(`/posts/public?${params}`, revalidate);
}

/**
 * Fetch a single published post by slug.
 */
export async function getPostBySlug(slug: string, revalidate = 60): Promise<Post | null> {
  try {
    return await cmsGet<Post>(`/posts/public/${slug}`, revalidate);
  } catch {
    return null;
  }
}

// ── Projects ────────────────────────────────────────────────────────────

export interface ProjectListResponse {
  data: Project[];
  total: number;
}

/**
 * Fetch all published projects.
 */
export async function getProjects(
  options: { category?: string } = {},
  revalidate = 60
): Promise<Project[]> {
  const params = new URLSearchParams({ status: 'published' });
  if (options.category) params.set('category', options.category);
  try {
    const res = await cmsGet<Project[] | ProjectListResponse>(
      `/projects/public?${params}`,
      revalidate
    );
    return Array.isArray(res) ? res : res.data;
  } catch {
    return [];
  }
}

/**
 * Fetch a single project by slug.
 */
export async function getProjectBySlug(slug: string, revalidate = 60): Promise<Project | null> {
  try {
    return await cmsGet<Project>(`/projects/public/${slug}`, revalidate);
  } catch {
    return null;
  }
}

/**
 * Fetch all project categories.
 */
export async function getProjectCategories(revalidate = 300): Promise<ProjectCategory[]> {
  try {
    return await cmsGet<ProjectCategory[]>('/project-categories/public', revalidate);
  } catch {
    return [];
  }
}

// ── Team ────────────────────────────────────────────────────────────────

/**
 * Fetch all team members (ordered by `order` field).
 */
export async function getTeam(revalidate = 300): Promise<TeamMember[]> {
  try {
    return await cmsGet<TeamMember[]>('/team/public', revalidate);
  } catch {
    return [];
  }
}

// ── Testimonials ────────────────────────────────────────────────────────

/**
 * Fetch all testimonials (ordered by `order` field).
 */
export async function getTestimonials(revalidate = 300): Promise<Testimonial[]> {
  try {
    return await cmsGet<Testimonial[]>('/testimonials/public', revalidate);
  } catch {
    return [];
  }
}

// ── Services ─────────────────────────────────────────────────────────────

/**
 * Fetch all services (ordered by `order` field).
 */
export async function getServices(revalidate = 300): Promise<Service[]> {
  try {
    return await cmsGet<Service[]>('/services/public', revalidate);
  } catch {
    return [];
  }
}

// ── Pages ────────────────────────────────────────────────────────────────

/**
 * Fetch a published static page by slug.
 */
export async function getPageBySlug(slug: string, revalidate = 60): Promise<Page | null> {
  try {
    return await cmsGet<Page>(`/pages/public/${slug}`, revalidate);
  } catch {
    return null;
  }
}

// ── SEO ──────────────────────────────────────────────────────────────────

/**
 * Fetch SEO meta for a given route (e.g. "/", "/blog", "/about").
 */
export async function getSeoMeta(route: string, revalidate = 300): Promise<SeoMeta | null> {
  try {
    const encoded = encodeURIComponent(route);
    return await cmsGet<SeoMeta>(`/seo-meta/public?route=${encoded}`, revalidate);
  } catch {
    return null;
  }
}

// ─── Image URL Helper ──────────────────────────────────────────────────────

/**
 * Build a full URL for a CMS-hosted image path (e.g. "/uploads/image.jpg").
 */
export function cmsImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${CMS_API_URL}${path}`;
}
