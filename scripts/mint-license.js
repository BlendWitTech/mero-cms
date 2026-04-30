#!/usr/bin/env node
/**
 * mint-license.js — generate a Custom-tier license key for self-use.
 *
 * Use cases:
 *   - You're the one running this Mero install (developer / Blendwit).
 *   - You want to test the Custom-tier flow (mero-pro bundle, all
 *     designs unlocked, plugin marketplace open) without going through
 *     the marketplace checkout.
 *   - You're shipping a one-off license to an early customer who paid
 *     out-of-band (bank transfer, invoice, handshake) and you don't
 *     want to fake a Stripe order to mint the JWT.
 *
 * The license is a JWT signed with the same JWT_SECRET the running
 * backend uses. license.service.getLicenseInfo() decodes it the same
 * way as a marketplace-issued license — so the customer's experience
 * is identical to a paid one.
 *
 * Usage:
 *   node scripts/mint-license.js                       # custom · org · 1y
 *   node scripts/mint-license.js --tier custom --email me@blendwit.com
 *   node scripts/mint-license.js --tier premium --type personal --seats 1
 *   node scripts/mint-license.js --tier custom --expires 2027-12-31
 *
 * Flags (all optional):
 *   --tier      basic | premium | professional | enterprise | custom   (default: custom)
 *   --type      personal | org                                          (default: org)
 *   --email     license subject (sub claim)                             (default: dev@blendwit.com)
 *   --domain    cloud-only domain binding                               (default: omitted)
 *   --seats     numeric seats limit                                     (default: omitted = unlimited)
 *   --expires   ISO date the license expires                            (default: today + 365 days)
 *   --secret    JWT signing secret                                      (default: $JWT_SECRET or backend/secrets.json)
 *
 * Then paste the printed token into Admin → Settings → License.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');

// ── Arg parser ───────────────────────────────────────────────────────
function parseArgs() {
    const argv = process.argv.slice(2);
    const out = {};
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (!a.startsWith('--')) continue;
        const k = a.slice(2);
        const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
        out[k] = v;
    }
    return out;
}
const args = parseArgs();

// ── Resolve JWT_SECRET ───────────────────────────────────────────────
// Priority: --secret flag, $JWT_SECRET env var, secrets.json files.
//
// The backend writes `secrets.json` to `process.cwd()` — which means
// the file lands at:
//   • <repo>/secrets.json          when launched from the repo root
//                                   (the common case via `npm run dev:all`)
//   • <repo>/backend/secrets.json  when launched from inside backend/
//                                   (the cd'd-in case)
//
// We probe both. Then fall back to backend/.env / .env.local in case
// the operator hand-set JWT_SECRET there. Last resort: caller passes
// --secret. Mirrors the order license.service expects so a token minted
// here verifies against whatever the running backend has loaded.
function resolveSecret() {
    if (args.secret && args.secret !== 'true') return args.secret;
    if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

    const candidates = [
        path.join(ROOT, 'secrets.json'),
        path.join(ROOT, 'backend', 'secrets.json'),
    ];
    for (const p of candidates) {
        if (!fs.existsSync(p)) continue;
        try {
            const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
            if (raw.JWT_SECRET) return raw.JWT_SECRET;
        } catch { /* keep probing */ }
    }

    // .env files — naive parser (KEY=VALUE per line, ignores quoting
    // and substitution; good enough since JWT_SECRET is always raw).
    const envCandidates = [
        path.join(ROOT, '.env'),
        path.join(ROOT, 'backend', '.env'),
        path.join(ROOT, '.env.local'),
        path.join(ROOT, 'backend', '.env.local'),
    ];
    for (const p of envCandidates) {
        if (!fs.existsSync(p)) continue;
        const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
        for (const line of lines) {
            const m = line.match(/^\s*JWT_SECRET\s*=\s*"?([^"\r\n]+)"?\s*$/);
            if (m) return m[1].trim();
        }
    }

    return null;
}

// ── Tier → packageId resolution (mirrors license.service) ────────────
function tierToPackageId(tier, type) {
    const personal = {
        basic: 'personal-basic',
        premium: 'personal-premium',
        professional: 'personal-professional',
        enterprise: 'personal-professional', // personal side has no enterprise
        custom: 'personal-custom',
    };
    const org = {
        basic: 'org-basic',
        premium: 'org-premium',
        professional: 'org-enterprise',      // org side has no professional
        enterprise: 'org-enterprise',
        custom: 'org-custom',
    };
    return type === 'personal' ? personal[tier] : org[tier];
}

// ── Sign ─────────────────────────────────────────────────────────────
function b64url(input) {
    return Buffer.from(input).toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function sign(payload, secret) {
    const headerEncoded  = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payloadEncoded = b64url(JSON.stringify(payload));
    const data = `${headerEncoded}.${payloadEncoded}`;
    const sig = crypto.createHmac('sha256', secret).update(data).digest();
    return `${data}.${b64url(sig)}`;
}

// ── Main ─────────────────────────────────────────────────────────────
function main() {
    const tier  = (args.tier  || 'custom').toLowerCase();
    const type  = (args.type  || 'org').toLowerCase();
    const email = args.email  || 'dev@blendwit.com';
    const seats = args.seats  ? Number(args.seats) : undefined;
    const domain = args.domain && args.domain !== 'true' ? args.domain : undefined;
    const expiresAt = args.expires && args.expires !== 'true'
        ? new Date(args.expires).toISOString()
        : new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();

    const validTiers = ['basic', 'premium', 'professional', 'enterprise', 'custom'];
    if (!validTiers.includes(tier)) {
        console.error(`Bad --tier "${tier}". Valid: ${validTiers.join(', ')}`);
        process.exit(1);
    }
    if (!['personal', 'org'].includes(type)) {
        console.error(`Bad --type "${type}". Valid: personal, org`);
        process.exit(1);
    }
    const packageId = tierToPackageId(tier, type);
    if (!packageId) {
        console.error(`Could not resolve packageId for tier="${tier}" type="${type}"`);
        process.exit(1);
    }

    const secret = resolveSecret();
    if (!secret) {
        console.error('JWT_SECRET not found.');
        console.error('');
        console.error('The script searched these locations (in order):');
        console.error('  1. --secret <value>                        (CLI flag)');
        console.error('  2. process.env.JWT_SECRET                  (env var)');
        console.error(`  3. ${path.join(ROOT, 'secrets.json')}`);
        console.error(`  4. ${path.join(ROOT, 'backend', 'secrets.json')}`);
        console.error(`  5. ${path.join(ROOT, '.env')}`);
        console.error(`  6. ${path.join(ROOT, 'backend', '.env')}`);
        console.error('');
        console.error('Fix one of these and re-run:');
        console.error('  • Boot the backend once: `npm run dev:backend` — it generates secrets.json on first start.');
        console.error('  • Or pass it inline:     `npm run mint-license -- --secret <your-secret>`');
        console.error('  • Or set the env var:    `$env:JWT_SECRET = "<your-secret>"; npm run mint-license`');
        console.error('');
        console.error('If you don\'t have a backend running yet, you can mint a throwaway secret —');
        console.error('it just needs to MATCH whatever the backend uses when it boots:');
        console.error('  $env:JWT_SECRET = "dev-secret-rotate-before-prod"');
        console.error('  npm run mint-license');
        console.error('  echo \'{"JWT_SECRET":"dev-secret-rotate-before-prod"}\' > secrets.json   # so backend uses the same one');
        process.exit(1);
    }

    const issuedAt = Math.floor(Date.now() / 1000);
    const exp = Math.floor(new Date(expiresAt).getTime() / 1000);
    const payload = { sub: email, tier, packageId, iat: issuedAt, exp };
    if (domain) payload.domain = domain;
    if (seats !== undefined) payload.seats = seats;

    const token = sign(payload, secret);

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Tier:       ${tier} (${packageId})`);
    console.log(`Subject:    ${email}`);
    if (domain) console.log(`Domain:     ${domain}`);
    if (seats !== undefined) console.log(`Seats:      ${seats}`);
    console.log(`Expires:    ${expiresAt}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('License key:');
    console.log('');
    console.log(token);
    console.log('');
    console.log('Paste this into Admin → Settings → License → Activate.');
    console.log('');
}

main();
