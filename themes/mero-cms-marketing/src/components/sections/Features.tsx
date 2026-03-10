const FEATURES = [
  {
    icon: '✏',
    title: 'Blog & Content',
    description: 'Rich text posts with categories, tags, SEO fields, and scheduled publishing. Author management built in.',
  },
  {
    icon: '◈',
    title: 'Portfolio & Projects',
    description: 'Showcase work with categories, client info, technologies, and live URLs. Filter by category.',
  },
  {
    icon: '◎',
    title: 'Team Management',
    description: 'Add team members with photos, roles, bios, and social links. Ordered display for your About page.',
  },
  {
    icon: '⬡',
    title: 'Services Showcase',
    description: 'List and describe what you offer with icons, images, and detailed content pages per service.',
  },
  {
    icon: '◇',
    title: 'Lead Generation',
    description: 'Capture contact form submissions. View, filter, and manage leads directly in the admin.',
  },
  {
    icon: '≡',
    title: 'Navigation Menus',
    description: 'Build unlimited menus (header, footer, mobile) with nested items. Themes consume them via API.',
  },
  {
    icon: '☐',
    title: 'Static Pages',
    description: 'Create unlimited pages (About, Privacy, Terms) with full rich text content. Publish or draft.',
  },
  {
    icon: '⊕',
    title: 'SEO Tools',
    description: 'Per-route meta titles, descriptions, OG images, canonical URLs, and robots directives.',
  },
  {
    icon: '⌺',
    title: 'Analytics Dashboard',
    description: 'Track page views, unique visitors, and top content. Google Analytics G-Tag integration ready.',
  },
  {
    icon: '⟳',
    title: 'User Roles & RBAC',
    description: 'Full role-based access control. Create custom roles with fine-grained permissions per module.',
  },
  {
    icon: '⊞',
    title: 'Theme System',
    description: 'Upload Next.js themes as ZIP files. Seed initial content, activate, and point to any deployment URL.',
  },
  {
    icon: '⇌',
    title: 'REST API',
    description: 'Every module exposes public endpoints. Build themes, mobile apps, or integrations against a clean API.',
  },
];

export default function Features() {
  return (
    <section className="section section--alt" id="features">
      <div className="container">
        <div className="section-header section-header--center">
          <span className="section-label">What's Included</span>
          <h2 className="section-title">Everything You Need to Run a Modern Website</h2>
          <p className="section-subtitle">
            Every module is optional. Enable only what your project requires — the rest stays out of your way.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}>
          {FEATURES.map(feature => (
            <div
              key={feature.title}
              className="card"
              style={{ padding: '1.5rem' }}
            >
              <div style={{
                width: '40px', height: '40px',
                background: 'var(--color-accent-glow)',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 'var(--radius)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.125rem',
                marginBottom: '1rem',
                color: 'var(--color-accent)',
              }}>
                {feature.icon}
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.5rem', color: 'var(--color-text)' }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', lineHeight: 1.65 }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
