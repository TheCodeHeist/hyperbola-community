<!-- Copilot / AI agent instructions for the Hyperbola repository -->

# Quick context

- This is a Next.js (App Router) TypeScript frontend using Tailwind + ShadCN UI patterns.
- Key folders: `app/` (Next App Router), `components/` (feature components), `components/ui/` (shadcn-style primitives), and `lib/` (helpers).
- Important tech: Next 16.x, Tailwind, ShadCN/Radix, Drizzle ORM + postgres driver, BetterAuth, Bun used in package scripts.

# What you need to know to be productive

- Run & build: see `package.json` scripts — the project expects Bun wrappers.

  - dev: `bun --bun next dev`
  - build: `bun --bun next build`
  - start: `bun --bun next start`
  - DB push (drizzle): `bunx drizzle-kit push:pg`

- Fonts and global styles live in `app/layout.tsx` and `app/globals.css`.
- UI primitives live in `components/ui/` and follow the shadcn pattern: small, exportable components built with Tailwind + CVA.

  - Example: `components/ui/button.tsx` uses `class-variance-authority` + `cn` from `lib/utils.ts`.

- CSS classname helpers: `lib/utils.ts` exports `cn(...inputs)` (clsx + twMerge). Use it for predictable Tailwind merges.

# Project conventions / patterns (concrete)

- Component naming: file name matches export (e.g., `Button` in `components/ui/button.tsx`). Keep default export named when possible.
- Styling: prefer CVA variants + `cn` for composed classes. See `buttonVariants` in `components/ui/button.tsx` for the canonical pattern.
- Data attributes: components use `data-*` attributes (e.g., `data-slot`, `data-variant`, `data-size`) — preserve them when composing children.
- Use server and client components according to Next App Router rules. `app/` routes default to server components; add `'use client'` at top of files that need client-side hooks.

# Integration points to watch

- Authentication: `better-auth` is in dependencies — auth flows and middleware (if present) will tie into Next routes; search for `better-auth` usage when changing auth.
- Database: Drizzle ORM + `drizzle-kit` are used for migrations/pushes. DB operations will target Postgres (postgres driver). Migration/deploy runs use `bunx drizzle-kit` as above.

# Debugging & developer workflow tips

- If you need a local dev server, run the `dev` script (Bun wrapper) from `package.json`.
- Linting: `npm script "lint"` runs `eslint` — inspect `eslint.config.mjs` at repo root.
- When adding UI components, follow the `components/ui/*` pattern: CVA variants, export both the component and the variant helpers when applicable.

# Examples to reference

- Use `lib/utils.ts`'s `cn` when merging classes.
- Follow `components/ui/button.tsx` for how to structure CVA-based components and data attributes.
- `app/layout.tsx` demonstrates global font setup and where to apply `globals.css`.

# Non-goals / things not assumed

- The repo plan lists testing (Vitest) and other tools (React Testing Library), but no test configuration or scripts are present in the current tree — do not add tests that assume a test runner without confirming setup.

# If you change files

- Update imports using the `@/` alias if present (codebase uses `@/` in examples). Keep TypeScript paths consistent with `tsconfig.json`.

# Where to look next

- `package.json` (scripts & deps)
- `PLAN.md` (high-level rationale)
- `app/layout.tsx`, `app/page.tsx` (app router pattern)
- `components/ui/*` (component patterns)
- `lib/utils.ts` (helper utilities)

---

If anything here is unclear or you want more granular examples (e.g., how to add a new Drizzle model, or a full example of adding a client component), tell me which area and I'll expand with concrete code edits and tests.
