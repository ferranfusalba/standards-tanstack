# Standards Browser

International standards data browser built with TanStack Start (SSR), TanStack Table, React 19, and Tailwind CSS v4.

## Code style

- **Formatter/linter**: Biome (not prettier/eslint). Run `npx biome check` before committing. Tabs, double quotes.
- **Avoid `any` types** unless strictly justified. Use proper generics and type imports.
- **Tests**: Write and update tests when adding or changing logic. Run `npx vitest run`. Test files go in `__tests__/` directories next to the code they test. To test server functions (`createServerFn`), mock `@tanstack/react-start` — see `src/data/__tests__/` for the pattern.

## Styling

- **Use semantic color tokens** (`bg-background`, `bg-secondary`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-accent`, etc.) instead of hardcoded `gray-*` classes. These tokens automatically adapt to light/dark mode via CSS variables in `src/styles.css`.
- **Light/dark support is required** on all new and updated views and components. The `.dark` class on `<html>` drives the theme. Use `dark:` prefix only for colors that don't have a semantic token (e.g., colored highlights like `bg-red-100 dark:bg-red-950`).
- **shadcn/ui components**: Install with `pnpm dlx shadcn@latest add <component>`.

## Data tables

- **Use shared components**: `<DataTable>` (`src/components/DataTable.tsx`) for table rendering, `<Pagination>` (`src/components/Pagination.tsx`) for pagination controls, `<ColumnVisibility>` (`src/components/ColumnVisibility.tsx`) for column toggle dropdown. Do not duplicate table/pagination markup in routes.
- Tables use TanStack Table with `globalFilterFn: 'fuzzy'` and `getFilteredRowModel()`.
- **Fuzzy filter thresholds**: Use `fuzzyFilter` (CONTAINS) by default. Use `fuzzyFilterAcronym` (ACRONYM) for tables with short codes (e.g., languages).
- **Multi-table views** (countries, timezones): Share a single `globalFilter` state across all tables on the page.
- Filter utilities live in `src/lib/fuzzy-filter.ts`.
- **Lazy-loading for heavy nested data**: Send counts in the initial response, fetch full data on demand (e.g., subdivisions loaded on row expand via a separate server function).
- **Custom styling per table**: Use `cellClassName` and `headerClassName` props on `<DataTable>` for table-specific highlights or borders. Use `renderExpandedRow` for expandable row content.

## Accessibility

- Accessibility (sort headers, aria-labels) is built into `<DataTable>` and `<Pagination>`. No need to add manually.
- **Search inputs**: Always include `aria-label`.

## SEO

- Every route must define `head()` returning `title` and `description` meta tags.
- Root layout includes Open Graph meta tags (`og:title`, `og:description`, `og:image`, `og:type`).

## Architecture

- **TanStack Start** with Nitro for SSR — not a plain SPA.
- File-based routing in `src/routes/`. Route tree is auto-generated (`src/routeTree.gen.ts` — do not edit).
- Data loaders use `loader: async () => { ... }` in route definitions.
- **Server functions**: Use `createServerFn({ method })`. For functions that accept input, chain `.validator(fn)` before `.handler()` (the older `.inputValidator()` is deprecated).
- **TanStack version lockstep**: Keep every `@tanstack/*` Start + Router package (`react-router`, `react-router-devtools`, `react-router-ssr-query`, `react-start`, `router-plugin`) pinned to exact, coordinated versions — they ship as one release train. Caret ranges let them drift apart, which makes `getServerFnById` return `undefined` and 500s every server function at runtime (tests mock this, so they won't catch it).
- **Caching**: Router sets `defaultStaleTime: 5min` and `defaultPreloadStaleTime: 30s`. No need to add per-route cache config unless overriding.
- **Loading/error UI**: Router provides `defaultPendingComponent` (spinner) and `defaultErrorComponent`. Override per-route only when needed.
- Path alias: `@/*` maps to `src/*`.
