const STEPS = [
  {
    number: '01',
    title: 'Deploy in Minutes',
    description:
      'Clone the repo, set your environment variables, and push to Railway. The backend runs in Docker automatically — no server configuration required.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 12h14M12 5l7 7-7 7"
        />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Choose a Theme',
    description:
      'Upload a theme ZIP or use a built-in theme. Import demo content with one click so you start with a fully populated, professional-looking website immediately.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Manage Your Content',
    description:
      'Update pages, write blog posts, manage media and handle enquiries — all from the clean, intuitive dashboard. No developer required for day-to-day changes.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-14">
          <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wider">
            Getting Started
          </span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            From zero to a live, fully managed website in three simple steps.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line — desktop only */}
          <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-0.5 bg-indigo-100 -z-0" />

          {STEPS.map((step, index) => (
            <div
              key={step.number}
              className="relative bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 p-8 flex flex-col"
            >
              {/* Step number */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white flex-shrink-0">
                  {step.icon}
                </div>
                <span className="text-5xl font-black text-indigo-50 leading-none select-none">
                  {step.number}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed text-sm flex-1">{step.description}</p>

              {/* Connector arrow for mobile */}
              {index < STEPS.length - 1 && (
                <div className="flex justify-center mt-6 md:hidden">
                  <svg
                    className="w-6 h-6 text-indigo-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
