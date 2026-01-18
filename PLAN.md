# Tech Stack Plan for Hyperbola

## Core Stack

- Frontend & Full-Stack Framework: Next.js 15 (App Router)
- UI & Styling:

  - Tailwind CSS → Rapid, utility-first styling.
  - ShadCN/UI → Beautiful, accessible, customizable components built on Tailwind + Radix UI. Perfect for tables, forms, modals, and dashboards.

- Authentication: BetterAuth
- Database: PostgreSQL
- ORM: Drizzle ORM
- Database Driver: postgres-js (used by Drizzle)

## Runtime & Deployment

- Runtime: Node.js to start (stable ecosystem), with Bun as an optional upgrade later
- Deployment / Self-Hosting:
  - Docker + Docker Compose (for easy one-click self-hosting)
  - Target platforms: VPS (DigitalOcean, Hetzner), Railway, Coolify, or CapRover
  - Optional: Provide a simple setup script or CapRover template for non-technical teachers

## Additional Tools & Libraries

- TypeScript → Full end-to-end type safety (mandatory for maintainable open-source project)
- Zod → Schema validation for forms and API inputs
- React Hook Form → Performant forms with ShadCN
- TanStack Query (React Query) → Data fetching, caching, and synchronization
- Date Library: date-fns or Day.js (lightweight calendar/scheduling)
- File Uploads (if needed for assignments): UploadThing or direct to S3-compatible (e.g., MinIO for self-hosted)
- Testing: Vitest + React Testing Library
- Linting/Formatting: ESLint + Prettier
