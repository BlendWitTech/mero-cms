#!/usr/bin/env node
/**
 * issue-license.js — Blendwit internal tool
 * Generates a signed LICENSE_KEY JWT for a customer deployment.
 *
 * Usage:
 *   node tools/issue-license.js --tier Premium --domain customer.com --seats 5 --days 365
 *
 * Options:
 *   --tier     Basic | Premium | Enterprise | Custom  (default: Basic)
 *   --domain   Customer's domain (default: *)
 *   --seats    Number of user seats (default: 5)
 *   --days     License validity in days (default: 365)
 *
 * KEEP tools/keys/license-private.pem PRIVATE. Never commit it.
 */

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const args = process.argv.slice(2);
const get = (flag, def) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : def; };

const tier   = get('--tier',   'Basic');
const domain = get('--domain', '*');
const seats  = parseInt(get('--seats', '5'), 10);
const days   = parseInt(get('--days',  '365'), 10);

const VALID_TIERS = ['Basic', 'Premium', 'Enterprise', 'Custom'];
if (!VALID_TIERS.includes(tier)) { console.error(`Invalid tier "${tier}". Must be: ${VALID_TIERS.join(', ')}`); process.exit(1); }

const keyPath = path.join(__dirname, 'keys', 'license-private.pem');
if (!fs.existsSync(keyPath)) { console.error(`Private key not found at ${keyPath}`); process.exit(1); }
const privateKey = fs.readFileSync(keyPath, 'utf8');

const now = Math.floor(Date.now() / 1000);
const exp = now + days * 86400;

const header  = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
const payload = Buffer.from(JSON.stringify({ tier, domain, seats, iat: now, exp })).toString('base64url');
const signingInput = `${header}.${payload}`;

const sign = crypto.createSign('SHA256');
sign.update(signingInput);
const signature = sign.sign(privateKey, 'base64url');

const jwt = `${signingInput}.${signature}`;
const expiryDate = new Date(exp * 1000).toISOString().split('T')[0];

console.log('\n=== Mero CMS License Key ===');
console.log(`Tier:    ${tier}`);
console.log(`Domain:  ${domain}`);
console.log(`Seats:   ${seats}`);
console.log(`Expires: ${expiryDate} (${days} days)`);
console.log('\nAdd to customer .env:');
console.log(`LICENSE_KEY=${jwt}\n`);
