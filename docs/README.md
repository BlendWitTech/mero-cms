# Mero CMS — Developer Documentation

This folder is the canonical reference for everyone building on Mero CMS. New team members should start with [PRODUCT.md](./PRODUCT.md) for context, then [SYSTEM_ARCHITECTURE](./ARCHITECTURE.md) for how the pieces fit together, then jump to whichever specialist guide matches what they're building.

## Quick map

**For everyone**

| Doc | What it covers |
|---|---|
| [PRODUCT.md](./PRODUCT.md) | What Mero CMS is, who it's for, how the business works |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | High-level system architecture, three-service split, request flow |
| [TECH.md](./TECH.md) | Tech stack, build pipeline, deployment |
| [customer/INSTALL.md](./customer/INSTALL.md) | Customer-facing install guide — four installation paths (Cloud / managed / VPS / local) plus the setup wizard walkthrough |
| [../SETUP.md](../SETUP.md) | Developer setup + deployment guide (npm workflow, Railway / Vercel staging, production) |
| [FEATURES.md](./FEATURES.md) | Inventory of every feature, split into Theme features vs CMS features |

**For backend / data engineers**

| Doc | What it covers |
|---|---|
| [DATABASE.md](./DATABASE.md) | Prisma schema, every model, indexes, modular schema assembly |

**For theme developers** (most common Custom-tier use case)

| Doc | What it covers |
|---|---|
| [THEME_DEVELOPMENT.md](./THEME_DEVELOPMENT.md) | End-to-end theme dev guide — quick start, project structure, theme.json, branding contract, page schema, API integration, visual editor, capability gating, build, packaging |
| [THEME_MANIFEST_SPEC.md](./THEME_MANIFEST_SPEC.md) | Focused reference for `theme.json` package + plugin compatibility fields |

**For dashboard developers** (extending the admin)

| Doc | What it covers |
|---|---|
| [DASHBOARD_DEVELOPMENT.md](./DASHBOARD_DEVELOPMENT.md) | How the admin is built, design system, how to add a new admin page, how to add a settings tab, how to add a sidebar entry, how to integrate with the contract-driven branding pipeline |
| [VISUAL_EDITOR_ROADMAP.md](./VISUAL_EDITOR_ROADMAP.md) | The visual editor's design and what's coming |

**For package / plugin developers**

| Doc | What it covers |
|---|---|
| [PACKAGE_DEVELOPMENT.md](./PACKAGE_DEVELOPMENT.md) | How to add or modify package tiers, capabilities, pricing, and the Cloud add-on |
| [PLUGIN_DEVELOPMENT.md](./PLUGIN_DEVELOPMENT.md) | Plugin manifest format, dual-gate compatibility, install flow, marketplace listing |

**Roadmaps and historical**

| Doc | What it covers |
|---|---|
| [V1.5_IMPLEMENTATION_PLAN.md](./V1.5_IMPLEMENTATION_PLAN.md) | What's planned for v1.5 |
| [onboarding.md](./onboarding.md) | New-developer onboarding checklist |

## How to use these docs in your team

**New hires.** Day 1 — read PRODUCT.md and ARCHITECTURE.md. Day 2 — set up locally per SETUP.md and TECH.md. Day 3 — pick the specialist guide that matches their first task.

**Outside contractors building a theme.** Hand them THEME_DEVELOPMENT.md plus access to the `themes/mero-pro` reference theme. Don't share backend or admin source unless they need to extend it.

**Outside contractors building a plugin.** Hand them PLUGIN_DEVELOPMENT.md plus a list of which plugin manifest fields you'll require.

**Internal product / pricing changes.** Read PACKAGE_DEVELOPMENT.md for the tier matrix and pricing table; changes there ripple through the marketing pricing page, the admin's License tab, and capability gating across the codebase.

## Contributing to the docs

These are living documents. When you change behaviour the docs describe, update the relevant doc in the same PR. Each doc carries a `Last revision` line at the top — bump it.

If you find something here that disagrees with the code, the code is the source of truth. File a doc-update task or fix it directly.

## Versioning

The docs version is currently **v1.4.0** (April 2026). When the next release ships, bump every doc's revision line and add a changelog entry to the relevant doc.
