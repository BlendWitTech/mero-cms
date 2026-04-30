/**
 * @mero/theme-base — public surface.
 *
 * Templates import from this barrel rather than reaching into individual
 * file paths so we can refactor internals without breaking consumers.
 * Add new exports here when introducing a new shared component or
 * helper; remove only with a major version bump.
 *
 * Usage in a template:
 *
 *   import {
 *       renderWidgets,
 *       renderCmsPage,
 *       getSiteData,
 *       getPage,
 *       EditorBridge,
 *       CapabilitiesProvider,
 *   } from '@mero/theme-base';
 *
 * For per-component imports (e.g. a template that wants to wrap or
 * extend a single section), use the subpath form:
 *
 *   import Hero from '@mero/theme-base/components/sections/Hero';
 */

// ── Section components ──────────────────────────────────────────────
export { default as Hero, type HeroData, type HeroVariant } from './components/sections/Hero';
export { default as LogoStrip, type LogoStripData } from './components/sections/LogoStrip';
export { default as FeatureBlocks, type FeatureBlocksData, type FeatureBlock } from './components/sections/FeatureBlocks';
export { default as UseCases, type UseCasesData } from './components/sections/UseCases';
export { default as Stats, type StatsData } from './components/sections/Stats';
export { default as PricingTeaser, type PricingTeaserData } from './components/sections/PricingTeaser';
export { default as Testimonials, type TestimonialsData } from './components/sections/Testimonials';
export { default as FAQ, type FAQData } from './components/sections/FAQ';
export { default as FinalCTA, type FinalCTAData } from './components/sections/FinalCTA';
export { default as PageHero, type PageHeroData } from './components/sections/PageHero';
export { default as RichContent, type RichContentData } from './components/sections/RichContent';
export { default as ListSection, type ListSectionData, type ListSectionItem } from './components/sections/ListSection';
export { default as ContactForm, type ContactFormData } from './components/sections/ContactForm';

// ── Pro widgets (Phase 7, #90) ──────────────────────────────────────
// Tier-gated at the editor / palette layer (premium: true in
// widgetCatalog). Renderer itself is permissive — themes can opt to
// expose pro widgets to lower tiers if they want.
export { default as Carousel,        type CarouselData,        type CarouselSlide }      from './components/sections/pro/Carousel';
export { default as VideoEmbed,      type VideoEmbedData }                                from './components/sections/pro/VideoEmbed';
export { default as Gallery,         type GalleryData,         type GalleryItem }        from './components/sections/pro/Gallery';
export { default as Accordion,       type AccordionData,       type AccordionItem }      from './components/sections/pro/Accordion';
export { default as Tabs,            type TabsData,            type TabsItem }           from './components/sections/pro/Tabs';
export { default as Countdown,       type CountdownData }                                 from './components/sections/pro/Countdown';
export { default as PricingTable,    type PricingTableData,    type PricingTableTier }   from './components/sections/pro/PricingTable';
export { default as ComparisonTable, type ComparisonTableData, type ComparisonRow }      from './components/sections/pro/ComparisonTable';

// ── UI primitives ───────────────────────────────────────────────────
export { default as Button } from './components/ui/Button';
export { default as Reveal } from './components/ui/Reveal';
export { default as SectionHeader } from './components/ui/SectionHeader';
export { default as UiContactForm } from './components/ui/ContactForm';
export { default as EmblemWatermark } from './components/ui/EmblemWatermark';

// ── Editor + capability wiring ──────────────────────────────────────
export { default as EditorBridge } from './components/EditorBridge';
export { CapabilitiesProvider, useCapabilities, CapabilityGate, TierGate } from './components/CapabilitiesProvider';

// ── Plugin widget runtime (Phase 6.2) ───────────────────────────────
// Themes call `registerPluginWidget(...)` at module init to plug in a
// component for a plugin-contributed widget type. Without registration,
// `renderWidgets` falls back to a placeholder that's only visible in
// edit mode.
export {
    registerPluginWidget,
    getPluginWidget,
    listPluginWidgets,
    renderPluginWidget,
    PluginWidgetPlaceholder,
} from './lib/plugin-widgets';

// ── Library helpers ─────────────────────────────────────────────────
export {
    renderWidgets,
    isKnownWidgetType,
    knownWidgetTypes,
    type WidgetLike,
} from './lib/widget-registry';
export { renderCmsPage, simpleLayout } from './lib/page-renderer';
export {
    getSiteData,
    getPage,
    getCapabilities,
    getMenu,
    getPackages,
    submitLead,
    submitForm,
    login,
    register,
    mediaUrl,
    pickSection,
    type SiteDataBundle,
    type SiteDataSettings,
    type PageRecord,
    type CapabilityMap,
    type AuthResponse,
} from './lib/api';
