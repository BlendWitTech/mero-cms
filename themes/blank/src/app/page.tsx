import { getSiteData } from '@/lib/cms';

export default async function HomePage() {
  const { settings } = await getSiteData();

  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        {settings.siteTitle || 'My Site'}
      </h1>
      {settings.tagline && (
        <p style={{ color: '#666', fontSize: '1.1rem' }}>{settings.tagline}</p>
      )}
      <p style={{ marginTop: '2rem', color: '#999', fontSize: '0.875rem' }}>
        Site coming soon.
      </p>
    </main>
  );
}
