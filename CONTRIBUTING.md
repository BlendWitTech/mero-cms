# Contributing to Mero CMS

Mero CMS is a proprietary product owned by **Blendwit Tech**. Contributions are by invitation only.

---

## How to Become a Contributor

1. Apply at [blendwit.com/mero-cms/contribute](https://blendwit.com/mero-cms/contribute)
2. Once approved, you will receive a GitHub collaborator invite
3. Sign the Contributor Agreement sent to your email
4. Set up the project locally by following [SETUP.md](SETUP.md) — Part 1

---

## Contribution Rules

- All contributions must be made via **Pull Requests** — never push directly to `develop` or `main`
- Every PR must pass all CI checks before it can be reviewed
- Every PR must be reviewed and approved by a Blendwit Tech maintainer before merging
- PRs go to `develop` — never directly to `main`
- All contributed code becomes the intellectual property of Blendwit Tech under the terms of the Contributor Agreement
- Do not share, redistribute, or discuss internal implementation details outside of approved channels

---

## Git Workflow

```
main         ← production (owners only, via PR from develop)
  └── develop  ← staging (contributor PRs merge here)
        └── feature/your-feature  ← your work branch
```

```bash
# Always start from the latest develop
git checkout develop
git pull origin develop

# Create a feature branch
git checkout -b feature/short-description

# Work and commit using conventional commits (see below)
git add <specific files>
git commit -m "feat(module): what you built"

# Push and open a PR to develop
git push origin feature/your-feature
```

---

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>
```

| Type | When to use |
|---|---|
| `feat` | New feature or behaviour |
| `fix` | Bug fix |
| `chore` | Build tooling, CI, config, dependencies |
| `docs` | Documentation changes only |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `style` | Formatting, whitespace — no logic change |
| `test` | Adding or updating tests |

**Examples:**
```
feat(blogs): add scheduled publishing
fix(themes): resolve CORS on theme zip upload
chore(ci): pin node version to 20
docs(setup): add troubleshooting section for Railway
```

---

## Code Standards

- TypeScript strict mode — no `any` unless unavoidable and documented
- NestJS modules follow the existing pattern: `module / controller / service / dto`
- Frontend components use Tailwind CSS utility classes — no custom CSS files
- All API endpoints require `@JwtAuthGuard` and `@RequirePermissions(...)` unless explicitly public
- Never commit `.env` files, secrets, or credentials
- Never commit files in `backend/uploads/` — user media must not be in git

---

## PR Checklist

Before opening a PR, confirm:

- [ ] `npm run build` passes in `backend/`
- [ ] `npm run build` passes in `frontend/`
- [ ] No new TypeScript errors introduced
- [ ] No hardcoded URLs, credentials, or theme-specific text in base CMS files
- [ ] New modules/pages are guarded with proper permission checks
- [ ] PR title follows the commit convention format
- [ ] PR description explains what changed and why

---

## Reporting Issues

Approved contributors may open issues directly in this repository.

For all others: [hello@blendwit.com](mailto:hello@blendwit.com)

---

*Unauthorized use of this software is a violation of copyright law. See [LICENSE](LICENSE).*
