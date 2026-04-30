/**
 * Blendwit Tech — design-local widget registry. The Positivus-aesthetic
 * registry for the Blendwit company site (image 3 in the brand brief).
 * Phase 7's design dispatcher picks this or `vivid` (the Whitepace
 * variant) based on `bundle.activeDesign` in theme.json.
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
