# Mero CMS — Documentation Updates (April 2026)

This file tracks the transition of project documentation following the v1.2.0 audit and strategy alignment.

## Milestone 0 — Repository Governance
- [x] **Branch Alignment**: Synchronised `main`, `develop`, `marketing`, and `production` to a common stable baseline.
- [x] **Dependabot Optimisation**: Reduced branch noise by implementing monthly grouped updates.
- [x] **Strategy Definition**: Formally established roles for each primary branch.

## v1.3.0 — Stability & Performance

## Core Updates
- **README.md**: Standardised branch strategy, updated roadmap to v2.0, and synchronised architecture overview.
- **PRICING.md**: Transitioned from simple option-based pricing to the **Basic/Premium/Enterprise** tier model.
- **DEVELOPER_GUIDE.md**: Updated vision for a white-label CMS engine and added section on high-priority technical debt (Image pipeline, Swagger).
- **SETUP.md**: Refined onboarding steps to match current CLI tools and monorepo structure.

## New Tracking
- **task.md**: A persistent roadmap file to track implementation progress across milestones.
- **updated.md**: This document, summarizing the structural and strategic changes.

## Branch Strategy Alignment
The repository follows a strictly gated promotion flow:
1. `production`: Stable release (sellable product, version controlled releases).
2. `main`: Backup stable version (includes demo, safety fallback).
3. `testing`: Staging/QA (pre-production verification, supports demo).
4. `develop`: Active development hub (new features stem from here).
5. `marketing`: Live environment for Mero CMS itself (supports demo).
6. `dependabot/*`: Automatic dependency updates (monthly grouped updates).

---
*Created by Antigravity AI*
