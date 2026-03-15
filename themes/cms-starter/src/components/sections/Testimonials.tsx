import type { Testimonial } from '@/lib/cms';

interface TestimonialsProps {
  testimonials: Testimonial[];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < rating ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function QuoteIcon() {
  return (
    <svg
      className="w-8 h-8 text-indigo-200"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
    </svg>
  );
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    clientName: 'Rohan Sharma',
    clientRole: 'Full-stack Developer',
    clientCompany: 'Freelance',
    content:
      'Mero CMS saved us weeks of setup. We deployed a custom theme in a day and the client loved the simplicity of the dashboard.',
    rating: 5,
  },
  {
    clientName: 'Anita Tamrakar',
    clientRole: 'Marketing Manager',
    clientCompany: 'StartupNepal',
    content:
      "Finally a CMS where I don't need a developer just to update the homepage. I handle all content changes myself now.",
    rating: 5,
  },
  {
    clientName: 'Dev Shrestha',
    clientRole: 'Agency Owner',
    clientCompany: 'PixelForge',
    content:
      'We run Mero CMS for all our client projects. The theme system lets us give each client a unique look without extra work.',
    rating: 5,
  },
  {
    clientName: 'Priya Joshi',
    clientRole: 'Product Manager',
    clientCompany: 'TechCo',
    content:
      "The REST API made it trivial to build a mobile app on top of the same content. Best headless CMS experience I've had.",
    rating: 5,
  },
];

export default function Testimonials({ testimonials }: TestimonialsProps) {
  const items = testimonials && testimonials.length > 0 ? testimonials : DEFAULT_TESTIMONIALS;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wider">
            Testimonials
          </span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900">
            Loved by Teams Worldwide
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Here's what developers and content teams are saying about Mero CMS.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((testimonial, index) => (
            <div
              key={testimonial.id ?? `${testimonial.clientName}-${index}`}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 p-6 flex flex-col"
            >
              {/* Quote icon */}
              <div className="mb-4">
                <QuoteIcon />
              </div>

              {/* Content */}
              <p className="text-gray-700 leading-relaxed text-sm flex-1 mb-6">
                "{testimonial.content}"
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Avatar placeholder */}
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-600 font-bold text-sm">
                      {testimonial.clientName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {testimonial.clientName}
                    </div>
                    {(testimonial.clientRole || testimonial.clientCompany) && (
                      <div className="text-xs text-gray-500">
                        {[testimonial.clientRole, testimonial.clientCompany]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    )}
                  </div>
                </div>

                {typeof testimonial.rating === 'number' && testimonial.rating > 0 && (
                  <StarRating rating={testimonial.rating} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
