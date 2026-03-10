import type { Metadata } from 'next';
import { getProjects, getProjectCategories, cmsImageUrl } from '@/lib/cms';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Our portfolio of work.',
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const [projects, categories] = await Promise.all([
    getProjects({ category: searchParams?.category }, 60).catch(() => []),
    getProjectCategories(300).catch(() => []),
  ]);

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Projects</h1>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <a
            href="/projects"
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: !searchParams?.category ? '#2563eb' : '#f3f4f6',
              color: !searchParams?.category ? '#fff' : '#374151',
            }}
          >
            All
          </a>
          {categories.map(cat => (
            <a
              key={cat.id}
              href={`/projects?category=${cat.slug}`}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: searchParams?.category === cat.slug ? '#2563eb' : '#f3f4f6',
                color: searchParams?.category === cat.slug ? '#fff' : '#374151',
              }}
            >
              {cat.name}
            </a>
          ))}
        </div>
      )}

      {projects.length === 0 ? (
        <p style={{ color: '#6b7280' }}>No projects to show yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {projects.map(project => (
            <div
              key={project.id}
              style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', overflow: 'hidden', background: '#fff' }}
            >
              {project.featuredImage ? (
                <img
                  src={cmsImageUrl(project.featuredImage)!}
                  alt={project.title}
                  style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '200px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No image</span>
                </div>
              )}
              <div style={{ padding: '1.25rem' }}>
                {project.category && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', letterSpacing: '0.05em' }}>
                    {project.category.name}
                  </span>
                )}
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0.4rem 0 0.5rem' }}>
                  {project.title}
                </h2>
                {project.description && (
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.6 }}>
                    {project.description}
                  </p>
                )}
                {project.technologies.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.75rem' }}>
                    {project.technologies.map(tech => (
                      <span key={tech} style={{ background: '#eff6ff', color: '#2563eb', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontWeight: 600 }}>
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                {project.projectUrl && (
                  <a
                    href={project.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-block', marginTop: '1rem', color: '#2563eb', fontSize: '0.875rem', fontWeight: 600 }}
                  >
                    View Project →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
