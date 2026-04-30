import UiContactForm from '../../components/ui/ContactForm';

export interface ContactFormData {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    /** Submit button label — passed down to UiContactForm via prop;
        when unset the underlying form uses its default ("Send"). */
    submitLabel?: string;
    /** Reply-to / contact email shown below the form for the user. */
    email?: string;
    /** Optional phone number shown alongside email. */
    phone?: string;
    /** Optional address shown alongside the contact methods. */
    address?: string;
    /** Optional formId — when set, the underlying ContactForm submits
        through the admin's form-builder pipeline (/public/forms/:id/submit)
        instead of the default lightweight /public/leads endpoint. */
    formId?: string;
}

const DEFAULTS: Required<ContactFormData> = {
    eyebrow: '',
    title: 'Get in touch',
    subtitle: '',
    submitLabel: '',
    email: '',
    phone: '',
    address: '',
    formId: '',
};

/**
 * ContactForm section — header text + the actual form on the left,
 * contact details on the right. Submits via the existing UiContactForm
 * client component (which handles state + the /public/leads or
 * /public/forms/:id/submit endpoint depending on whether a formId is
 * provided).
 *
 * Authors get to customize the surrounding copy + reply-to details from
 * the SectionEditor; the form itself stays standardized so backend
 * validation + rate limiting are consistent.
 */
export default function ContactForm({ data = {} }: { data?: ContactFormData }) {
    const d = { ...DEFAULTS, ...data };
    const hasContactInfo = !!(d.email || d.phone || d.address);

    return (
        <section
            data-section-id="contact-form"
            data-section-type="ContactForm"
            className="contact-form-section"
            style={{ padding: 'clamp(48px, 6vw, 96px) 0' }}
        >
            <div
                className="container"
                style={{
                    display: 'grid',
                    gridTemplateColumns: hasContactInfo ? 'minmax(0, 1fr) minmax(0, 320px)' : '1fr',
                    gap: 32,
                    alignItems: 'start',
                }}
            >
                <div>
                    {(d.eyebrow || d.title || d.subtitle) && (
                        <header style={{ marginBottom: 24 }}>
                            {d.eyebrow && (
                                <div className="section-eyebrow" style={{ marginBottom: 8 }}>
                                    {d.eyebrow}
                                </div>
                            )}
                            {d.title && (
                                <h2
                                    className="display"
                                    style={{ fontSize: 'clamp(24px, 2.4vw, 32px)', marginBottom: d.subtitle ? 8 : 0 }}
                                >
                                    {d.title}
                                </h2>
                            )}
                            {d.subtitle && (
                                <p style={{ color: 'var(--ink-3)', lineHeight: 1.55 }}>
                                    {d.subtitle}
                                </p>
                            )}
                        </header>
                    )}
                    <UiContactForm formId={d.formId || undefined} />
                </div>

                {hasContactInfo && (
                    <aside
                        style={{
                            background: 'var(--paper)',
                            border: '1px solid var(--line, rgba(0,0,0,0.08))',
                            borderRadius: 16,
                            padding: 20,
                            position: 'sticky',
                            top: 100,
                        }}
                    >
                        <div className="section-eyebrow" style={{ marginBottom: 12 }}>
                            Other ways
                        </div>
                        {d.email && (
                            <div style={{ marginBottom: 12 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    Email
                                </div>
                                <a href={`mailto:${d.email}`} style={{ color: 'var(--ink)', textDecoration: 'none' }}>
                                    {d.email}
                                </a>
                            </div>
                        )}
                        {d.phone && (
                            <div style={{ marginBottom: 12 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    Phone
                                </div>
                                <a href={`tel:${d.phone.replace(/\s+/g, '')}`} style={{ color: 'var(--ink)', textDecoration: 'none' }}>
                                    {d.phone}
                                </a>
                            </div>
                        )}
                        {d.address && (
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    Address
                                </div>
                                <p style={{ color: 'var(--ink-2)', whiteSpace: 'pre-line', margin: 0 }}>
                                    {d.address}
                                </p>
                            </div>
                        )}
                    </aside>
                )}
            </div>
        </section>
    );
}
