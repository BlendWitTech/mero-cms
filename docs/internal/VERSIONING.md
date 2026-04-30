# Versioning Model

Mero CMS uses **independent per-branch versioning with selective promotion**.
This is non-standard but matches how we actually work — code is developed
freely, tested when ready, and released to customers only when polished.
Read this before tagging anything.

Pair with [`BRANCHING.md`](./BRANCHING.md) (which covers *where* code
flows) and [`OPERATIONS.md`](./OPERATIONS.md) (which covers *how to deploy*).

---

## The mental model in one sentence

A version number is a **label for a milestone of work**, not a counter
that ticks forward in lockstep across branches. The same version label
(`v1.4`) can appear on multiple branches — or on none — depending on
where in the lifecycle that batch of work currently lives.

---

## The three lanes

Each branch lives in its own tag namespace:

| Branch | Tag pattern | Example | What it means |
|---|---|---|---|
| `develop` | `dev-vX.Y.Z` | `dev-v1.5.3` | "v1.5.3's work was completed in develop at this commit." |
| `testing` | `staging-vX.Y.Z` | `staging-v1.3.6` | "v1.3.6 was promoted to the testing environment at this commit." |
| `main` | `vX.Y.Z` (no prefix) | `v1.4.0` | "v1.4.0 was released to customers at this commit." Triggers `release.yml`. |

The `dev-` and `staging-` prefixes are **internal markers** — you and
your team see them in `git log`, but customers never do. The
unprefixed `vX.Y.Z` tags on `main` are **canonical releases** — they
appear on the GitHub Releases page, become Docker images on GHCR,
and generate downloadable bundles for customers who buy a license.

---

## What "skipping a version" means

A version can have **one, two, or three** tags depending on how far
through the lifecycle it gets:

| Tags present | What happened |
|---|---|
| Only `dev-v1.3` | v1.3 was developed but never tested or shipped. Internal experiment. |
| `dev-v1.3` + `staging-v1.3` | v1.3 was developed and tested but found problems; never released. |
| All three | v1.3 went through the full lifecycle. Customers see it. |

**A "skipped" version is one where the lifecycle stopped early** —
the next tag in that lane simply jumps past it. So:

- develop might tag `dev-v1.3`, `dev-v1.4`, `dev-v1.5` in sequence.
- testing might only tag `staging-v1.5` — skipping v1.3 and v1.4 because
  you decided those weren't worth testing.
- main might also only tag `v1.5` — skipping straight from `v1.2` to `v1.5`.

Customers go from v1.2 to v1.5 without ever seeing v1.3 or v1.4.
Internally you know why those numbers don't appear: they were stages
of development you opted not to ship.

---

## Concrete walk-through

Starting state: everything at v1.2.

```
develop:  dev-v1.2  ←── HEAD
testing:  staging-v1.2  ←── HEAD
main:     v1.2  ←── HEAD
```

**Day 5 — refactor work lands on develop, tag it v1.3.**

```
develop:  dev-v1.2 ─→ ... ─→ dev-v1.3 ←── HEAD
testing:  staging-v1.2  ←── HEAD (untouched)
main:     v1.2  ←── HEAD (untouched)
```

Decision: this was an internal refactor, not worth testing or
shipping on its own. We keep going.

**Day 12 — analytics dashboard rewrite lands on develop, tag it v1.4.**

```
develop:  dev-v1.2 ─→ ... ─→ dev-v1.3 ─→ ... ─→ dev-v1.4 ←── HEAD
testing:  staging-v1.2  ←── HEAD
main:     v1.2  ←── HEAD
```

The analytics work has half-finished pieces. Still not shipping.

**Day 20 — payment-provider work lands, tag it v1.5. Time to ship.**

Promote to testing:

```powershell
git switch testing
git merge develop
git tag staging-v1.5
git push origin testing staging-v1.5
```

Test on Render + Vercel. Bugs found, fix on develop, repeat.

When testing is solid:

```powershell
git switch main
git merge testing
git tag v1.5.0
git push origin main v1.5.0
```

`release.yml` fires. Docker images go to GHCR. GitHub Release notes
auto-generate. Customers see "v1.5.0 released" — the previous release
they saw was "v1.2.0", so they perceive a jump.

**End state:**

```
develop:  dev-v1.2 ─→ dev-v1.3 ─→ dev-v1.4 ─→ dev-v1.5  ←── HEAD
testing:  staging-v1.2 ─→ staging-v1.5  ←── HEAD       (v1.3, v1.4 never tagged here)
main:     v1.2 ─→ v1.5  ←── HEAD                       (v1.3, v1.4 never tagged here)
```

The *code* from v1.3 and v1.4 is in main — a `git merge develop` brings
all the commits along. But the *tags* aren't there. From a release
history perspective, v1.3 and v1.4 don't exist for customers.

---

## Skipping the version label vs skipping the code

This is the subtle bit. Two different things, often confused:

**Skipping the version label** (the normal case):
- Tag `v1.3` doesn't exist on `main`.
- Customers don't see "v1.3 released" in any release notes.
- But the *code* changes from v1.3 are in main, because the merge
  `develop → main` brought all commits along, including v1.3-era ones.
- This is what you almost always want.

**Skipping the code** (rare, harder):
- Cherry-pick *only* v1.5's commits onto main, leaving v1.3 and
  v1.4 commits in develop only.
- Risky: v1.5 might depend on changes from v1.3 (e.g., a renamed
  function, a refactored module). Skip those commits and v1.5
  might not compile.
- Only do this if v1.3's changes are genuinely undesirable in
  production — e.g., v1.3 added a feature you've since decided to
  cancel.

When in doubt: assume you mean "skip the label," not "skip the code."

---

## Keeping it sane — the one rule

Tags within a single lane must be **monotonic forward**.

**Allowed:**
- develop: `dev-v1.2`, `dev-v1.3`, `dev-v1.4`, `dev-v1.5` (each tag higher than the last)
- testing: `staging-v1.2`, `staging-v1.5` (skipping numbers is fine)
- main: `v1.2`, `v1.5` (skipping numbers is fine)

**Not allowed:**
- main: `v1.5`, then `v1.4` later (going backward confuses customers)
- develop: `dev-v1.3` after `dev-v1.5` already exists (looks like time travel)

If you need to ship a fix to a customer running v1.5 while you're
mid-development on v1.6, that's a hotfix:

```powershell
git switch -c hotfix/the-thing v1.5
# ... fix it ...
git switch main
git merge hotfix/the-thing
git tag v1.5.1
git push origin main v1.5.1
```

Then merge the same hotfix into develop so it survives the next
develop→main promotion. Hotfix tags (`v1.5.1`, `v1.5.2`) are still
monotonic — they tick the patch number up.

---

## Quick commands

**Check the latest version on each lane (run from the relevant branch):**

```powershell
git switch develop
git describe --tags --match "dev-v*" --abbrev=0   # latest dev tag

git switch testing
git describe --tags --match "staging-v*" --abbrev=0   # latest testing tag

git switch main
git describe --tags --match "v[0-9]*" --abbrev=0   # latest release tag
```

**Tag a new milestone:**

```powershell
# Develop milestone
git switch develop
git tag dev-v1.5.3
git push origin dev-v1.5.3

# Testing milestone
git switch testing
git tag staging-v1.5.3
git push origin staging-v1.5.3

# Customer release (this triggers release.yml)
git switch main
git tag v1.5.3
git push origin v1.5.3
```

**See all tags across all lanes:**

```powershell
git tag --list                     # everything, sorted
git tag --list "dev-v*"            # just develop tags
git tag --list "staging-v*"        # just testing tags
git tag --list "v[0-9]*"           # just release tags
```

---

## FAQ

**"What if our team is working on v1.4 but I want to tag a v1.3 bug
fix on main?"**

You can't on `main` directly — `v1.3` would be older than `v1.5`
which is already there. Use a hotfix branch off the `v1.3` tag:

```powershell
git switch -c hotfix/v1.3-fix v1.3
# ... fix ...
git tag v1.3.1
git push origin v1.3.1
```

But understand: `v1.3.1` won't exist on `main`. It exists on the
hotfix branch, and customers running v1.3 can update to v1.3.1.
Most customers won't bother — they'll wait for the next main
release. This is the cost of letting customer versions diverge.

In practice: only do hotfixes for security issues or hard breakage.
Regular bugs wait for the next release.

**"Does package.json's `version` field need to match the latest tag?"**

Best practice: yes, `package.json` `"version"` on each branch matches
the latest tag in that branch's lane. `main` has `"version": "1.5.0"`,
develop has `"version": "1.5.3"` (whatever its latest dev tag is),
testing matches whatever's currently being tested. Bump it as part
of the same commit you tag.

But it's not enforced by anything. If `package.json` and the latest
tag drift, nothing breaks — it just means the version printed in
some UI somewhere might lag the tag.

**"What if I want to release a version that develop doesn't have
yet?"**

You can't. By the time something hits `main` it has already passed
through `testing`, which has already inherited from `develop`. The
flow is one-directional. If you want to release something that
hasn't been on develop, develop needs to get it first — push the
work there, tag it, promote.

**"Is this overkill for a one-person team?"**

Honestly yes, until you have a second person or actual customers
running an older version while you develop a newer one. Until then,
the simpler `develop → main` two-branch model from BRANCHING.md is
enough. This three-lane model earns its keep when you're shipping
to paying customers and need a controlled testing stage between
"latest dev work" and "what customers run."

---

## Current state (as of v1.2.0)

| Lane | Latest tag | Notes |
|---|---|---|
| `develop` | `dev-v1.2.0` | Synced to main as the starting point. |
| `testing` | `staging-v1.2.0` | Synced to main as the starting point. |
| `main` | `v1.2.0` | First version we're treating as a real release. |

All three branches and `package.json` files are at `1.2.0`. The next
work on develop will land as v1.2.1 (patch) or v1.3.0 (minor). When
it's ready to test, we'll promote to testing with a `staging-vX.Y.Z`
tag. When customers should see it, we'll promote to main with a
`vX.Y.Z` tag.
