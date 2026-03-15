import type { Service } from '@/lib/cms';

interface FeaturesProps {
  id?: string;
  services: Service[];
}

// Default services shown when CMS hasn't loaded data yet
const DEFAULT_SERVICES: Service[] = [
  {
    title: 'Theme Management',
    description:
      'Upload ZIP themes, activate with one click, and import demo content instantly to get any site live fast.',
    icon: '🎨',
    order: 1,
  },
  {
    title: 'Rich Blog Editor',
    description:
      'Write and publish posts with categories, tags, featured images and per-post SEO meta — no plugin needed.',
    icon: '✍️',
    order: 2,
  },
  {
    title: 'Media Library',
    description:
      'Upload, organize and reuse images and files from a single clean panel. Serve media on any page.',
    icon: '🖼️',
    order: 3,
  },
  {
    title: 'Roles & Permissions',
    description:
      'Invite team members and control exactly who can create, edit, publish or delete content.',
    icon: '👥',
    order: 4,
  },
  {
    title: 'SEO Tools',
    description:
      'Set meta title, description, Open Graph image and canonical URL on every page and blog post.',
    icon: '🔍',
    order: 5,
  },
  {
    title: 'Public REST API',
    description:
      'Every piece of content is available as clean JSON. Build any frontend in any framework — or upload a theme.',
    icon: '🔌',
    order: 6,
  },
  {
    title: 'Analytics Dashboard',
    description:
      'Track page views, top content and traffic sources right inside the dashboard.',
    icon: '📊',
    order: 7,
  },
  {
    title: 'Leads & Forms',
    description:
      'Capture leads from contact forms and manage enquiries in the built-in leads inbox.',
    icon: '📬',
    order: 8,
  },
];

export default function Features({ id, services }: FeaturesProps) {
  const items =
    services && services.length > 0
      ? [...services].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      : DEFAULT_SERVICES;

  return (
    <section id={id} className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-14">
          <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wider">
            Features
          </span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900">
            Everything You Need
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            All the tools to build and manage your website — from content creation to deployment.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((service, index) => (
            <div
              key={service.id ?? `${service.title}-${index}`}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 p-6 flex flex-col"
            >
              {/* Icon container */}
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4 flex-shrink-0">
                {service.icon ? (
                  <span className="text-2xl" role="img" aria-label={service.title}>
                    {service.icon}
                  </span>
                ) : (
                  <svg
                    className="w-6 h-6 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                )}
              </div>

              <h3 className="text-base font-bold text-gray-900 mb-2">{service.title}</h3>
              {service.description && (
                <p className="text-sm text-gray-600 leading-relaxed flex-1">
                  {service.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
