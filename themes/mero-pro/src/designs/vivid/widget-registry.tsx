/**
 * Blendwit Tech — design-local widget registry.
 *
 * Mirrors the marketing design's registry shape so the page renderer
 * can swap registries by `bundle.activeDesign`. Phase 7 (#117) adds
 * the dispatch glue; until then this file just sits ready to be
 * imported by routes that opt in via `?_design=blendwit-tech` for
 * preview, or wholesale once the design picker activates the design.
 *
 * Each entry maps a widget `type` (the same canonical PascalCase used
 * across the bundle's moduleSchemas) to the Blendwit-styled component.
 * Types that aren't covered here fall through to a "render nothing
 * (warn in dev)" — the renderer's safety net.
 */

import type { ComponentType } from 'react';

import Hero, { type BlendwitHeroData } from './components/sections/Hero';
import FeatureBlocks, { type BlendwitFeatureBlocksData } from './components/sections/FeatureBlocks';
import PricingTeaser, { type BlendwitPricingTeaserData } from './components/sections/PricingTeaser';
import Testimonials, { type BlendwitTestimonialsData } from './components/sections/Testimonials';
import FinalCTA, { type BlendwitFinalCTAData } from './components/sections/FinalCTA';

export type BlendwitWidgetType =
    | 'Hero'
    | 'FeatureBlocks'
    | 'PricingTeaser'
    | 'Testimonials'
    | 'FinalCTA';

interface WidgetEntry {
    component: ComponentType<{ data?: any }>;
}

export const REGISTRY: Record<BlendwitWidgetType, WidgetEntry> = {
    Hero:           { component: Hero          as ComponentType<{ data?: BlendwitHeroData }> },
    FeatureBlocks:  { component: FeatureBlocks as ComponentType<{ data?: BlendwitFeatureBlocksData }> },
    PricingTeaser:  { component: PricingTeaser as ComponentType<{ data?: BlendwitPricingTeaserData }> },
    Testimonials:   { component: Testimonials  as ComponentType<{ data?: BlendwitTestimonialsData }> },
    FinalCTA:       { component: FinalCTA      as ComponentType<{ data?: BlendwitFinalCTAData }> },
};

export function isKnownWidgetType(type: string): type is BlendwitWidgetType {
    return type in REGISTRY;
}
