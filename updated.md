# Mero CMS — Documentation Updates (April 2026)

This file tracks the transition of project documentation following the v1.2.0 audit and strategy alignment.

## Core Updates
- **README.md**: Standardised branch strategy, updated roadmap to v2.0, and synchronised architecture overview.
- **PRICING.md**: Transitioned from simple option-based pricing to the **Basic/Premium/Enterprise** tier model.
- **DEVELOPER_GUIDE.md**: Updated vision for a white-label CMS engine and added section on high-priority technical debt (Image pipeline, Swagger).
- **SETUP.md**: Refined onboarding steps to match current CLI tools and monorepo structure.

## New Tracking
- **task.md**: A persistent roadmap file to track implementation progress across milestones.
- **updated.md**: This document, summarizing the structural and strategic changes.

## Branch Strategy Alignment
The repository follows a strictly gated promotion flow across these primary branches:
1. `production` (Stable release)
2. `main` (Primary source)
3. `testing` (Staging/QA)
4. `develop` (Active development)
5. `marketing` (Demo site)
6. `dependabot/*` (Automatic dependency updates)

---
*Created by Antigravity AI*
