# Mero CMS — Package & Pricing Developer Guide

Last revision: April 2026 · v1.4.0

This guide covers how Mero CMS's package tiers, capabilities, pricing, and the Mero Cloud add-on work — and how to add or change them. Aimed at engineers and product managers touching the pricing model.

**Scope.** Customer-facing tier configuration (Personal/Organizational × Basic/Premium/Pro/Enterprise/Custom), feature capability flags, the Mero Cloud add-on tiers, and the maintenance subscription model. Plugin pricing is in a separate doc.

---

## 1. The pricing model in one paragraph

Customers buy a **one-time CMS license** scoped to one of eight tier × type combinations. Each tier unlocks a specific set of capabilities (forms, webhooks, analytics, visual editor, etc.). Optional **annual maintenance** keeps the install on the latest version. **Mero Cloud** is a separate annual add-on for managed hosting. **Plugins** are sold per-plugin with their own pricing (subscription or one-time). This makes the typical purchase: one large upfront fee + optional smaller annual fees.

---

## 2. Where the data lives

A single source of truth: `backend/src/config/packages.ts`. Two main exports:

- `PACKAGES: CmsPackage[]` — the eight tier × type combinations.
- `CLOUD_TIERS: CloudTier[]` — three managed-hosting tiers.

Everything in the rest of the codebase reads from these:

- `/public/packages-config` exposes them to the marketing site's pricing page.
- `getCapabilities(packageId)` — used by the admin and theme to gate features.
- The seed script (`seed-packages.ts` if you ship one) syncs PACKAGES to the `Package` Prisma table for license verification.
- The marketing pricing page (`themes/mero-pro/src/app/pricing/`) renders directly from these configs — change the file, refresh the page, you see the new prices.

---

## 3. The Package shape

```ts
interface CmsPackage {
    id: PackageId;                  // 'personal-basic' | 'org-enterprise' | …
    name: string;                   // 'Basic', 'Premium', 'Custom'
    websiteType: 'personal' | 'organizational';
    tier: 1 | 2 | 3 | 4;           // numeric tier, also gates feature flags
    aiEnabled: boolean;
    priceNPR: number | 'custom';    // one-time license price
    priceFromNPR?: number;          // anchor for Custom tier
    maintenanceNPR?: number;        // optional annual maintenance fee
    tagline: string;
    features: string[];             // bulleted feature list shown on cards
    comingSoon?: string[];          // small-print feature list
    starterThemes: string[];        // theme slugs allowed; ['any'] = unrestricted
    supportLevel: 'email' | 'priority' | 'dedicated';
    highlighted?: boolean;          // shows the "Most popular" badge
    storageLimitGB: number;
    teamLimit: number;              // -1 = unlimited
    hasWhiteLabel: boolean;
    hasApiAccess: boolean;
    capabilities: PackageCapabilities;
}
```

Eight standard ids, never change them once shipped (license keys reference them):

```
personal-basic, personal-premium, personal-professional, personal-custom,
org-basic, org-premium, org-enterprise, org-custom
```

Adding a new tier means adding a new id; changes to existing ids break license validation.

---

## 4. The capabilities matrix

```ts
interface PackageCapabilities {
    themeCount: number;             // -1 = unlimited
    pluginMarketplace: boolean;
    themeCodeEdit: boolean;
    visualThemeEditor: boolean;
    dashboardBranding: boolean;     // brand the admin UI itself
    webhooks: boolean;
    collections: boolean;
    forms: boolean;
    analytics: boolean;
    auditLog: boolean;
    siteEditor: boolean;
    seoFull: boolean;
}
```

Five preset caps: `BASIC_CAPS`, `PREMIUM_CAPS`, `PROFESSIONAL_CAPS`, `ENTERPRISE_CAPS`, `CUSTOM_CAPS`. Most packages reference a preset; one-off customizations get their own.

When you add a new capability:

1. Add the field to `PackageCapabilities`.
2. Set its value in every preset (`BASIC_CAPS`, `PREMIUM_CAPS`, …) — the type system will force this.
3. Update `frontend/src/context/CapabilitiesContext.tsx`'s default to include it so the admin doesn't crash on first load before caps fetch.
4. Wire any guards/decorators that need it (typically a new `Permission` enum value plus a guard).
5. Update `docs/PRODUCT.md`'s feature comparison table (if applicable) and this doc's [reference table](#7-current-capability-reference).

---

## 5. Adding or changing a tier

### 5.1 Just changing the price

Edit the `priceNPR` field in `PACKAGES`. Restart the backend. The marketing pricing page picks it up on next request (it's not cached). The admin's License tab also reads it for the upgrade-prompt nudge.

The Prisma `Package` table holds a copy that the license-verification flow uses — re-seed it via `npx prisma db seed` (or the equivalent script) so the running database matches the config.

### 5.2 Changing what a tier includes

Edit the matching `*_CAPS` constant. The change ripples:

- `getCapabilities(packageId)` returns the new cap value.
- Admin pages gated by that cap show/hide accordingly.
- Marketing pricing page features list isn't auto-derived — update the `features: string[]` array on the package separately.
- Plugin marketplace gates re-evaluate (a plugin's `minTier` is checked against the cap).

After the change, audit:

- `frontend/src/components/layout/Sidebar.tsx` — sidebar entries gated by `requiresCapability`.
- Any page using `useCapabilities().has(...)`.
- Plugin manifests (`backend/src/plugins/catalog.ts`) — if a plugin's `minTier` was the only thing protecting a now-included feature, the gate is still correct.

### 5.3 Adding a new tier

Rare, but if you do (e.g. introducing "Pro Plus"):

1. Add the tier id to `PackageId` union type.
2. Add a new entry to `PACKAGES` with all required fields.
3. Define a new `*_CAPS` constant if it differs from existing presets.
4. Update `MIN_TIER_MAP` in `backend/src/plugins/catalog.ts` if the new tier should be a plugin gate.
5. Update `LicenseService.tierToPackageId` so license JWTs encoding the new tier resolve to the right package.
6. Update `frontend/src/app/setup/page.tsx`'s `TIER_LABELS` so the wizard shows the new tier name.
7. Re-seed the `Package` Prisma table.
8. Add a card to the marketing pricing page (it auto-renders from `PACKAGES`, so no extra work — just verify it looks good).

### 5.4 Maintenance pricing

`maintenanceNPR` is an optional annual fee on top of the one-time license. When set, the marketing pricing card shows it as a smaller line ("+ NPR 5,400/yr maintenance"). The pattern: ~18% of the license price, common for "lifetime license + paid updates" software.

When a maintenance subscription expires:

- The customer's CMS keeps running on the version they bought.
- New updates are gated until they renew.
- The license JWT itself doesn't expire (we set 10 years for license tier, 1 year for maintenance — see `signLicense()` in `license.service.ts`).

The expiration logic isn't enforced yet (v1.4 ships without auto-expiry). When you add it (v1.5), the place is `LicenseService.getLicenseInfo()` — read both the license expiry and a separate `maintenance_expires_at` setting, expose both to the admin's License tab.

---

## 6. Mero Cloud — the managed hosting add-on

`CLOUD_TIERS` is a separate three-tier structure for managed hosting:

```ts
interface CloudTier {
    id: 'cloud-starter' | 'cloud-business' | 'cloud-scale';
    name: string;
    pairsWith: ('personal' | 'organizational')[];
    annualNPR: number;
    tagline: string;
    features: string[];
    storageLimitGB: number;
    bandwidthGB: number;       // monthly
    sites: number;             // -1 = unlimited
    backupRetentionDays: number;
}
```

Cloud is sold separately from the CMS license — a customer needs both an active license AND an active Cloud subscription to use Cloud. The marketing pricing page renders Cloud as a distinct table below the license tiers.

Provisioning the actual Cloud infrastructure is ops work outside this codebase. The `CLOUD_TIERS` config is just the marketing/UI representation. When you build the provisioning pipeline (v1.5+), the code will:

1. Read the customer's purchased Cloud tier from their order.
2. Spin up a managed Postgres + storage bucket + DNS record.
3. Auto-apply the customer's CMS license + run the setup wizard programmatically.
4. Email the customer their cloud URL.

For now, Cloud purchases create an Order row; ops manually provisions and emails out the URL.

---

## 7. Current capability reference

| Capability | Basic | Premium | Pro / Enterprise | Custom |
|---|---|---|---|---|
| `themeCount` | 1 | 3 | 5 | unlimited |
| `forms` | ✓ | ✓ | ✓ | ✓ |
| `pluginMarketplace` | — | ✓ | ✓ | ✓ |
| `themeCodeEdit` | — | ✓ | ✓ | ✓ |
| `webhooks` | — | ✓ | ✓ | ✓ |
| `analytics` | — | ✓ | ✓ | ✓ |
| `auditLog` | — | ✓ | ✓ | ✓ |
| `siteEditor` | — | ✓ | ✓ | ✓ |
| `seoFull` | — | ✓ | ✓ | ✓ |
| `visualThemeEditor` | — | add-on | ✓ | ✓ |
| `collections` | — | — | ✓ | ✓ |
| `dashboardBranding` | — | — | Org Enterprise only | ✓ |
| `hasWhiteLabel` | — | — | ✓ | ✓ |
| `hasApiAccess` | — | — | ✓ | ✓ |
| `aiEnabled` | — | — | ✓ | ✓ |

**Forms** is in Basic as of the April 2026 rebalance — single contact form + lead inbox, no form-builder. The form-builder UI is gated to `siteEditor` (Premium+). This was the biggest activation-friction fix in v1.4.

**Visual editor** is at Pro/Enterprise by default; Premium customers can buy it as a marketplace add-on plugin.

---

## 8. Pricing reference (April 2026)

### Personal

| Tier | License (NPR) | Maintenance/yr | What's it for |
|---|---|---|---|
| Basic | 20,000 | 3,600 | Essential personal site |
| Premium | 30,000 | 5,400 | Full-feature personal site (sweet spot) |
| Professional | 75,000 | 13,500 | Independent consultants who need API + AI |
| Custom | from 150,000 | quoted | Bespoke development scope |

### Organizational

| Tier | License (NPR) | Maintenance/yr | What's it for |
|---|---|---|---|
| Basic | 25,000 | 4,500 | Small team starter |
| Premium | 70,000 | 12,600 | SMB sweet spot |
| Enterprise | 125,000 | 22,500 | Mid-market with compliance needs |
| Custom | from 250,000 | quoted | Bespoke + on-premise option |

### Mero Cloud

| Tier | Annual (NPR) | Sites | Storage | Bandwidth/mo |
|---|---|---|---|---|
| Cloud Starter | 12,000 | 1 | 10 GB | 50 GB |
| Cloud Business | 30,000 | 3 | 50 GB | 250 GB |
| Cloud Scale | 80,000 | unlimited | 500 GB | 2 TB |

---

## 9. License key format

License keys are JWTs signed with the install's `JWT_SECRET`:

```json
{
    "sub": "customer@example.com",
    "tier": "premium",
    "packageId": "personal-premium",
    "domain": "example.com",
    "seats": 5,
    "iat": 1714000000,
    "exp": 2030000000
}
```

Signed via HMAC-SHA256. The key is opaque to the customer — they paste it into the setup wizard or the admin's License tab. Verification logic lives in `backend/src/packages/license.service.ts:verifyKey()`.

When a customer purchases, the payments pipeline (`PaymentsService.markOrderPaid`) calls `LicenseService.signLicense({ customerEmail, packageId, tier })` and writes the resulting JWT to the Order row. The success page reads it from the Order and shows it for copy/paste. We also email it (planned for v1.5; currently a TODO).

`exp` is set to ~10 years for the license tier (effectively perpetual; we just want some upper bound). Maintenance subs are 1-year JWTs that get re-issued on renewal.

---

## 10. Common changes and their playbooks

### "Move forms from Premium to Basic" (we did this in v1.4)

1. `BASIC_CAPS.forms = true` in `packages.ts`.
2. `PREMIUM_CAPS.forms` already true — leave alone.
3. Add `'Single contact form + lead inbox'` to `personal-basic` and `org-basic` `features` arrays.
4. Update marketing pricing copy if needed.
5. Re-seed `Package` table.
6. Verify the admin's marketplace gate (`PluginManager` for the form-builder plugin) still gates by `siteEditor`, not `forms` — it should, but double-check.

### "Drop the price of Personal-Premium by 5,000"

1. Edit `priceNPR` on `personal-premium`.
2. Re-seed `Package` table so the License page shows the new price.
3. Optionally update `maintenanceNPR` to match the new ratio.
4. Marketing pricing page picks it up on next request.

### "Add a 'Storage' add-on"

Two patterns:

- **As a separate config** like `CLOUD_TIERS` — `STORAGE_ADDONS` array of `{ id, gbAdded, annualNPR }`. Render as a third table on the pricing page. Provisioned by ops.
- **As a plugin** — package the storage extension as a marketplace plugin with its own price. Reuses the plugin install + license flow.

The first option is cleaner if it'll be a common upsell; the second if it's niche.

### "Introduce a 'startup' discount tier"

Don't add a new package id (don't break license validation). Instead:

- Add a `discountCode` field to `Order`.
- Implement code-based pricing in `PaymentsService.createOrder` — if code matches "STARTUP25", multiply `amountNPR` by 0.75 before creating the provider order.
- The license JWT still encodes the original `packageId`; the discount is just on the price paid.

This way, internally the customer is on `personal-premium`, externally they paid less, and feature access is unchanged.

---

## 11. Where pricing renders

| Surface | File | What it shows |
|---|---|---|
| Marketing pricing page | `themes/mero-pro/src/app/pricing/page.tsx` | Personal/Org toggle, all tiers, Mero Cloud table |
| Marketing checkout | `themes/mero-pro/src/app/checkout/page.tsx` | Single-tier price + provider selector |
| Setup wizard's License step | `frontend/src/app/setup/page.tsx` | Free message; license key input |
| Admin's Settings → License | `frontend/src/components/admin/LicenseSettingsTab.tsx` | Current tier card, capability checklist, replace key form, upgrade nudge |
| Admin's Settings → Billing | `frontend/src/app/(admin)/dashboard/settings/page.tsx` (when `tab=billing`) | Detailed package usage |
| Plugin marketplace upsell | `frontend/src/app/(admin)/dashboard/plugins/page.tsx` | "Requires Premium" gate banners |

All of these read from the same `PACKAGES` config (or its DB-seeded mirror). One source of truth.

---

## 12. Testing pricing changes

When you change `packages.ts`:

- **Unit-ish.** No formal tests exist. Run the admin and marketing site, eyeball both for the new values.
- **Integration.** Hit `/public/packages-config` and `/packages/license` directly with curl; confirm the JSON matches what you expect.
- **End-to-end.** Run a full demo signup → purchase → license-paste flow with a test Khalti key. The flow must surface the new price at every step.
- **Re-seed.** Run the seed script after every change so the DB matches config. Otherwise the admin will show old prices in the Billing tab.

---

## 13. Changelog

- **v1.4.0** (2026-04) — Repackaged: forms moved to Basic, single prices replaced ranges (Personal-Premium 35k→30k, Personal-Pro 65-85k→75k, Org-Basic 35k→25k with multi-user differentiator, Org-Premium 60-80k→70k, Org-Enterprise 100-150k→125k). Custom tiers gained `priceFromNPR` anchors. Maintenance fees added per tier. Mero Cloud add-on tiers introduced.

- **v1.3.x** — Initial 8-tier matrix with price ranges. Forms gated to Premium+. Mero Cloud not yet defined.
