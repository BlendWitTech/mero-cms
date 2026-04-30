/**
 * Route-segment loading fallback for /dashboard/settings.
 *
 * This exists ONLY to override the dashboard-level loading.tsx for the
 * settings sub-tree. Without it, every navigation within settings (e.g.
 * switching tabs, which changes ?tab=) would trigger Next.js to show the
 * generic dashboard skeleton (stat cards, activity feed) on top of the
 * already-rendered settings page while the RSC refetches.
 *
 * The settings page manages its own client-side loading state and renders
 * its own tab-aware skeleton, so we return null here to hand control back
 * to the page component.
 */
export default function SettingsLoading() {
    return null;
}
