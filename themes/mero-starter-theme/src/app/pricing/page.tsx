import type { Metadata } from 'next';
import Pricing from '@/components/sections/Pricing';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Mero CMS pricing — free self-hosted or managed Pro plan. No lock-in.',
};

const FAQ = [
  {
    q: 'Can I really use the free version commercially?',
    a: 'Yes. Mero CMS is MIT licensed. You can use it for any commercial project, client work, or SaaS product with no restrictions.',
  },
  {
    q: 'What happens when I upgrade to Pro?',
    a: 'We migrate your existing installation to our managed infrastructure. You keep all your data and settings — no downtime.',
  },
  {
    q: 'Can I switch back to self-hosted?',
    a: 'Absolutely. Your data is always exportable. Mero CMS is open source — you\'re never locked in.',
  },
  {
    q: 'Do Pro plans include the admin panel?',
    a: 'Yes. The full admin dashboard is included. We host both the backend API and the admin frontend for you.',
  },
  {
    q: 'Is there a per-site or per-user limit?',
    a: 'On the free plan you host as many sites as your own server supports. Pro plans are per-installation with unlimited users.',
  },
];

export default function PricingPage() {
  return (
    <>
      <Pricing />

      {/* FAQ */}
      <section className="section">
        <div className="container" style={{ maxWidth: '720px' }}>
          <div className="section-header section-header--center">
            <span className="section-label">FAQ</span>
            <h2 className="section-title">Common Questions</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {FAQ.map(item => (
              <div key={item.q} className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text)', marginBottom: '0.625rem' }}>
                  {item.q}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', lineHeight: 1.7 }}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>

          {/* Still have questions */}
          <div style={{ textAlign: 'center', marginTop: '3rem', padding: '2rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
            <p style={{ color: 'var(--color-muted)', marginBottom: '1rem' }}>Still have questions?</p>
            <a href="/contact" className="btn btn-primary">
              Contact Us →
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
