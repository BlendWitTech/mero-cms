const API = process.env.CMS_API_URL || 'http://localhost:3001';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SiteData {
  settings: {
    siteTitle: string;
    tagline: string;
    logoUrl: string | null;
    faviconUrl: string | null;
    primaryColor: string | null;
    footerText: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    address: string | null;
    socialLinks: Record<string, string> | null;
    activeTheme: string | null;
  };
  menus: Menu[];
  services: Service[];
  testimonials: Testimonial[];
  recentPosts: Post[];
}

export interface Menu {
  id: string;
  name: string;
  slug: string;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  label: string;
  url: string;
  order: number;
  children?: MenuItem[];
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon: string | null;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  content: string;
  rating: number | null;
  avatarUrl: string | null;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImageUrl: string | null;
  status: string;
  featured: boolean;
  publishedAt: string | null;
  createdAt: string;
  author?: { name: string };
  categories?: { name: string; slug: string }[];
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  featuredImageUrl: string | null;
  images?: string[];
  featured: boolean;
  status: string | null;
  location: string | null;
  priceFrom: string | null;
  areaFrom: string | null;
  areaTo: string | null;
  category?: { name: string; slug: string };
  createdAt: string;
}

export interface ProjectsResponse {
  data: Project[];
  total: number;
  page: number;
  limit: number;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

export async function getSiteData(): Promise<SiteData> {
  try {
    const res = await fetch(`${API}/public/site-data`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  } catch {
    return {
      settings: {
        siteTitle: 'KTM Plots',
        tagline: "Kathmandu Valley's Trusted Land Partner",
        logoUrl: null,
        faviconUrl: null,
        primaryColor: '#1B4332',
        footerText: null,
        contactEmail: null,
        contactPhone: null,
        address: null,
        socialLinks: null,
        activeTheme: 'ktm-plots',
      },
      menus: [],
      services: [],
      testimonials: [],
      recentPosts: [],
    };
  }
}

export async function getFeaturedPlots(): Promise<Project[]> {
  try {
    const res = await fetch(`${API}/projects/public/featured`, { next: { revalidate: 120 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getPlots(params?: {
  page?: number;
  limit?: number;
  category?: string;
}): Promise<ProjectsResponse> {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.category) q.set('category', params.category);
  try {
    const res = await fetch(`${API}/projects/public/list?${q}`, { next: { revalidate: 120 } });
    if (!res.ok) return { data: [], total: 0, page: 1, limit: 10 };
    return res.json();
  } catch {
    return { data: [], total: 0, page: 1, limit: 10 };
  }
}

export async function getPlotBySlug(slug: string): Promise<Project | null> {
  try {
    const res = await fetch(`${API}/projects/public/${slug}`, { next: { revalidate: 120 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getPosts(params?: {
  page?: number;
  limit?: number;
}): Promise<{ data: Post[]; total: number }> {
  const q = new URLSearchParams();
  q.set('status', 'published');
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  try {
    const res = await fetch(`${API}/public/posts?${q}`, { next: { revalidate: 120 } });
    if (!res.ok) return { data: [], total: 0 };
    return res.json();
  } catch {
    return { data: [], total: 0 };
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const res = await fetch(`${API}/public/posts/${slug}`, { next: { revalidate: 120 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  try {
    const res = await fetch(`${API}/public/pages/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function submitLead(data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
  source?: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API}/public/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, message: json.message || 'Failed to submit.' };
    return { success: true };
  } catch {
    return { success: false, message: 'Network error. Please try again.' };
  }
}

export function getImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API}/${path.replace(/^\//, '')}`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-NP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
