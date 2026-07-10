# Standards Browser

An international standards browser and export tool. **Explore** the world's reference standards — the technical codes and the geographical, social and political facts behind them. **Cross-check** in two directions: the JavaScript runtime's `Intl`/CLDR data against each standard's authoritative source, and every entity against its relations — a country's currencies, languages and timezones, and each of those back again. **Export** filtered slices as CSV/JSON to pull straight into your own product, from a country dropdown to a form that fills itself in.

## What's inside

| Section | Standards covered | Sources |
| --- | --- | --- |
| **Countries** | ISO 3166-1 (Alpha-2 / Alpha-3 / numeric), UN M49 regions, ISO 3166-2 subdivisions, ICAO 9303 passport codes, DSIT vehicle codes, IOC Olympic codes, UN & EU membership, aircraft registration prefixes | JS `Intl` API, United Nations Statistics Division, manually curated supplementary sources |
| **Currencies** | ISO 4217 active currencies (List One) and historical/withdrawn currencies (List Three) — alphabetic codes, numeric codes, minor units, fund-vs-currency type | SIX Group on behalf of ISO |
| **Timezones** | IANA tzdata identifiers, UTC offsets, regional groupings, DST information | JS `Intl` API, IANA tzdata |
| **Languages** | ISO 639-1 codes, native names, BCP 47 variants, Unicode CLDR locale data, runtime-supported variants | IANA Language Subtag Registry, Unicode CLDR 48, JS `Intl.DisplayNames` |

Each table supports fuzzy search, sortable columns, faceted/presence filters, column visibility toggles, pagination, and CSV/JSON export. Cross-links connect related entities (e.g. a country flag in the currency table jumps to that country, expanded to its currency section).

### Put it to work

The cross-links are what make the data *usable* — pick a country and its language, timezone and currency come with it. Concretely, the exported data feeds:

- **A country dropdown** — names, ISO codes, and the correct emoji flag for a form `<select>`.
- **A phone-code picker** — ITU calling codes paired with the country and its flag (`🇨🇭 +41`).
- **A self-filling form** — selecting a country populates its default language(s), timezone(s) and currency(ies).
- **Seed data** — filter to a subset (e.g. EU members only) and export a clean CSV/JSON to commit as fixtures or a lookup table.

## Tech stack

- **[TanStack Start](https://tanstack.com/start)** — SSR React framework on Nitro
- **[TanStack Router](https://tanstack.com/router)** — file-based routing in `src/routes/`
- **[TanStack Table](https://tanstack.com/table)** — headless table state for sorting, filtering, pagination, expansion
- **React 19** + **TypeScript**
- **Tailwind CSS v4** with semantic theme tokens (light/dark via CSS variables)
- **shadcn/ui** + **Radix UI** primitives, **Lucide** icons
- **Biome** for formatting and linting (not Prettier/ESLint)
- **Vitest** for unit and data-validation tests

## Getting started

```bash
npm install
npm run dev      # start the dev server on http://localhost:3001
```

### Available scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server (port 3001) |
| `npm run build` | Run the test suite, then build for production (Vercel-friendly) |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run the Vitest suite once |
| `npm run check` | Biome check (format + lint) |
| `npm run format` | Biome format |
| `npm run lint` | Biome lint |

## Project layout

```
src/
├── routes/              File-based routes — one folder per section
│   ├── __root.tsx       Root layout (header, theme, devtools)
│   ├── index.tsx        Landing page
│   ├── countries/  currencies/  languages/  timezones/  compare/
├── components/          Shared UI (DataTable, Pagination, ColumnVisibility, etc.)
├── data/                Standards data — one self-contained folder per domain
│   ├── countries/
│   │   ├── index.ts         Public API (barrel — consumers import "@/data/countries")
│   │   ├── types.ts         Country + subdivision types
│   │   ├── server.ts        createServerFn endpoints + row assembly
│   │   ├── localized-names.ts   CLDR name endpoints (Intl.DisplayNames)
│   │   ├── reference/       One file per source, keyed by country code
│   │   │   ├── un-m49.ts  un-membership.ts  region-map.ts  cctld.ts  mrz.ts
│   │   │   ├── fifa.ts  ioc.ts  vehicle.ts  phone.ts  aircraft-registration.ts
│   │   │   ├── intl-region-codes.ts  missing.ts
│   │   │   ├── local-short-names.ts + local-short-names.json
│   │   │   └── subdivisions.ts + subdivisions/   (200 ISO 3166-2 JSON files)
│   │   └── __tests__/
│   ├── currencies/      index.ts + __tests__/
│   ├── languages/       index.ts + country-languages.json + __tests__/
│   ├── timezones/       index.ts + __tests__/
│   ├── locale.ts        Request-locale detection
│   ├── versions.ts      Data-version stamps (CLDR / ICU / tz)
│   └── __tests__/       Cross-domain tests (uniqueness, cross-linking)
├── lib/                 Utilities (fuzzy filter, export, URL state, theme)
├── styles.css           Tailwind v4 + semantic color tokens
└── routeTree.gen.ts     Auto-generated by TanStack Router — do not edit
scripts/
└── validate-subdivisions.ts   Sanity check for ISO 3166-2 subdivision JSON
```

## Data architecture

Each domain (`countries`, `currencies`, `languages`, `timezones`) is a self-contained folder under `src/data/`, exposing a stable public API through an `index.ts` barrel — consumers import `@/data/countries`, never the internals. Data is served via `createServerFn({ method: 'GET' })` handlers that either:

1. Read from the JS runtime's built-in `Intl` API (countries, timezones, language names), or
2. Return manually maintained datasets compiled from the official sources listed above (UN M49, SIX Group, IANA tzdata, BCP 47 variants).

The `Intl` data and the official-source data are rendered side-by-side so divergences between the two are visible.

Inside `countries/`, the two concerns are kept apart: [`reference/`](src/data/countries/reference/) holds the raw data as **one file per source, keyed by country code** (`fifa.ts`, `phone.ts`, `un-m49.ts`, …), while [`server.ts`](src/data/countries/server.ts) joins them into a typed row. The 200 ISO 3166-2 subdivision files are wired in automatically with `import.meta.glob` — dropping a new `XX.json` into [`reference/subdivisions/`](src/data/countries/reference/subdivisions/) registers it, with no import list to keep in sync.

Heavy nested data (ISO 3166-2 subdivisions, per-country timezones/currencies) is lazy-loaded on row expand to keep the initial payload small.

## Recent improvements

Several capabilities were added while working through Master.dev's [TanStack Start & TanStack Query course](https://master.dev/courses/tanstack/), applying its patterns to this real codebase rather than a toy app:

- **Public JSON API** ([`src/routes/api/`](src/routes/api/)) — read-only server routes exposing every dataset as cacheable JSON (`/api/countries`, `/api/currencies`, `/api/languages`, `/api/timezones`, plus a self-documenting `/api` index) with permissive CORS. Handlers reuse the same server functions that power the UI, so the API and views never drift.
- **TanStack Query** for the on-demand, per-row fetches (subdivisions, localized names, locale switching) — replacing hand-rolled `useEffect` + cancellation with cached queries wired into SSR, so re-expanding a row is instant.

## Testing

Tests live in `__tests__/` directories next to the code they cover — one per domain folder, with cross-domain tests in `src/data/__tests__/`. The data-layer suite validates the **data itself**, not just the code:

- ISO code shape, uniqueness, and field presence (`countries`, `currencies`, `languages`, `timezones`)
- Reference-data integrity — every lookup key (FIFA, IOC, phone, subdivisions, …) resolves to a known country code, so a typo or stale key fails CI instead of rendering as a silent blank cell
- Cross-entity referential integrity — countries listed by currencies link back, etc.
- CSV/JSON export formatting and fuzzy-filter ranking behavior

```bash
npx vitest run
```

To test server functions, mock `@tanstack/react-start` — see `src/data/countries/__tests__/` for the pattern.

## Conventions

See [CLAUDE.md](./CLAUDE.md) for project-specific guidelines — especially around semantic color tokens (no hardcoded `gray-*` classes), shared `<DataTable>` / `<Pagination>` / `<ColumnVisibility>` usage, and the fuzzy-filter threshold pattern.

## License

The application source code is released under the [MIT License](./LICENSE).

The underlying standards data is sourced from the organizations listed in the table at the top of this file; their respective licenses and terms of use apply. ISO 4217 codes, ISO 3166 codes, and IANA tzdata are widely redistributable for reference purposes; consult each authority for the authoritative terms.
