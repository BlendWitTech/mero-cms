# This is the shared demo site — not for client installs

This app is deployed **once** at a single URL (e.g. `demo.blendwit.com`) and shared
with all prospects who want to explore Mero CMS before buying.

## What it is
A marketing + demo site with:
- Landing page explaining Mero CMS features and pricing
- OAuth sign-in (Google / GitHub / LinkedIn)
- Link to a live sandbox CMS instance

## What it is NOT
- It is NOT deployed per client
- It is NOT part of the CMS engine
- It is NOT a theme

## Deployment
One Vercel project: `BlendWitTech/mero-cms` → root directory: `demo/`
Env vars: see `.env.local.example`

## When onboarding a new client
Do NOT create a new Vercel project for this folder.
Clients get their own dashboard (`frontend/`) and theme (separate repo).
Send prospects to the shared demo URL instead.
