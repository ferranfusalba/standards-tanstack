import { createFileRoute } from "@tanstack/react-router";
import { DataVersionsPanel } from "@/components/DataVersionsPanel";
import { getDataVersions } from "@/data/versions";

const REPO_URL = "https://github.com/ferranfusalba/standards-tanstack";

// This page is the app's only home for project-level links — there is no site
// footer, so anything outward-facing (repo, issues, API) belongs here.
const PROJECT_LINKS = [
	{ label: "GitHub repository", href: REPO_URL, external: true },
	{ label: "Report an issue", href: `${REPO_URL}/issues`, external: true },
	{
		label: "MIT License",
		href: `${REPO_URL}/blob/main/LICENSE`,
		external: true,
	},
	{ label: "JSON API", href: "/api", external: false },
];

interface Source {
	name: string;
	href: string;
	usedFor: string;
	terms: string;
	termsHref?: string;
}

// Mirrors the "Data sources & attribution" table in README.md — keep the two in
// sync when a dataset is added or its provenance changes.
const SOURCES: Source[] = [
	{
		name: "Unicode CLDR / ICU",
		href: "https://cldr.unicode.org/",
		usedFor:
			"Country, language, currency and timezone display names; localized name variants, read at runtime through the JavaScript Intl API.",
		terms: "Unicode License v3 — © 1991–present Unicode, Inc.",
		termsHref: "https://www.unicode.org/license.txt",
	},
	{
		name: "IANA Time Zone Database",
		href: "https://www.iana.org/time-zones",
		usedFor:
			"Timezone identifiers, UTC offsets, DST rules and country mappings.",
		terms: "Public domain",
		termsHref: "https://data.iana.org/time-zones/tz-link.html",
	},
	{
		name: "IANA Language Subtag Registry",
		href: "https://www.iana.org/assignments/language-subtag-registry/",
		usedFor: "BCP 47 language subtags and variants.",
		terms: "Public domain (IETF / BCP 47)",
		termsHref: "https://www.rfc-editor.org/info/bcp47",
	},
	{
		name: "UN Statistics Division — M49",
		href: "https://unstats.un.org/unsd/methodology/m49/",
		usedFor:
			"Regional and subregional groupings, numeric country codes, UN membership.",
		terms: "Freely available for reference use",
	},
	{
		name: "SIX Group (ISO 4217 registrar)",
		href: "https://www.six-group.com/en/products-services/financial-information/data-standards.html",
		usedFor:
			"Currency codes, numeric codes, minor units, and the List One / List Three split.",
		terms: "Published freely by the ISO 4217 maintenance agency",
	},
	{
		name: "Wikipedia and other public references",
		href: "https://www.wikipedia.org/",
		usedFor:
			"Supplementary curated tables — IOC, FIFA, vehicle, aircraft and calling codes, ccTLDs, local short names, ISO 3166-2 subdivision names.",
		terms: "CC BY-SA 4.0 where applicable",
		termsHref: "https://creativecommons.org/licenses/by-sa/4.0/",
	},
	{
		name: "ISO Online Browsing Platform",
		href: "https://www.iso.org/obp/ui/",
		usedFor:
			"Cross-checking ISO 3166, 3166-2, 4217 and 639 code assignments against their registry entries.",
		terms:
			"Codes consulted as facts; ISO's standards documents are not reproduced here",
	},
];

export const Route = createFileRoute("/about")({
	component: About,
	loader: async () => ({ versions: await getDataVersions() }),
	head: () => ({
		meta: [
			{
				title: "About - Standards",
			},
			{
				name: "description",
				content:
					"How the Standards browser is built, which runtime and reference-data versions it reports, and the public sources every dataset is compiled from.",
			},
		],
	}),
});

function About() {
	const { versions } = Route.useLoaderData();

	return (
		<div className="p-6">
			<div className="max-w-4xl">
				<h1 className="text-3xl font-bold mb-4" data-view-title="About">
					About
				</h1>
				<p className="text-muted-foreground">
					Standards is a browser and export tool for the world's reference
					standards — ISO 3166 countries, ISO 4217 currencies, ISO 639 languages
					and IANA timezones. Every view renders what your JavaScript runtime's{" "}
					<code className="font-mono text-sm">Intl</code> data believes side by
					side with the standard's authoritative source, so divergences between
					the two are visible rather than silent. Filtered slices export as CSV
					or JSON, and a read-only{" "}
					<a
						href="/api"
						className="text-cyan-700 dark:text-cyan-400 hover:underline"
					>
						JSON API
					</a>{" "}
					serves the same data to your own tools.
				</p>
			</div>

			<section className="mt-10">
				<h2 className="text-xl font-semibold mb-1">Data freshness</h2>
				<p className="text-sm text-muted-foreground mb-4 max-w-4xl">
					These are the exact versions behind the data you are looking at right
					now, read from the running server.
				</p>
				<DataVersionsPanel versions={versions} />
			</section>

			<section className="mt-10">
				<h2 className="text-xl font-semibold mb-1">
					Data sources &amp; attribution
				</h2>
				<p className="text-sm text-muted-foreground mb-4 max-w-4xl">
					This project reproduces <strong>identifiers and factual data</strong>{" "}
					— codes, names, offsets, memberships — and not the text, tables or
					layout of any published standard. No paywalled standards document was
					copied, scraped or redistributed.
				</p>
				<div className="overflow-x-auto rounded-xl border border-border">
					<table className="w-full text-sm">
						<thead className="bg-secondary/60 text-left">
							<tr>
								<th className="px-4 py-3 font-semibold">Source</th>
								<th className="px-4 py-3 font-semibold">Used for</th>
								<th className="px-4 py-3 font-semibold">Terms</th>
							</tr>
						</thead>
						<tbody>
							{SOURCES.map((source) => (
								<tr key={source.name} className="border-t border-border">
									<td className="px-4 py-3 align-top font-medium min-w-52">
										<a
											href={source.href}
											target="_blank"
											rel="noopener noreferrer"
											className="text-cyan-700 dark:text-cyan-400 hover:underline"
										>
											{source.name}
										</a>
									</td>
									<td className="px-4 py-3 align-top text-muted-foreground min-w-72">
										{source.usedFor}
									</td>
									<td className="px-4 py-3 align-top text-muted-foreground min-w-52">
										{source.termsHref ? (
											<a
												href={source.termsHref}
												target="_blank"
												rel="noopener noreferrer"
												className="hover:text-foreground hover:underline"
											>
												{source.terms}
											</a>
										) : (
											source.terms
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>

			<section className="mt-10 max-w-4xl grid gap-6 md:grid-cols-2">
				<div className="rounded-xl border border-border bg-card p-6">
					<h2 className="text-lg font-semibold mb-2">Not affiliated</h2>
					<p className="text-sm text-muted-foreground">
						This is an independent, non-commercial open-source project. It is{" "}
						<strong>not affiliated with, endorsed by, or sponsored by</strong>{" "}
						ISO (International Organization for Standardization), IANA, the
						IETF, the ITU, the United Nations, SIX Group, or the Unicode
						Consortium. "ISO" and the ISO standard designations are trademarks
						of their respective owners and are used here{" "}
						<strong>descriptively only</strong>, to identify which standard a
						dataset corresponds to.
					</p>
				</div>
				<div className="rounded-xl border border-border bg-card p-6">
					<h2 className="text-lg font-semibold mb-2">Accuracy</h2>
					<p className="text-sm text-muted-foreground">
						Reference data is provided{" "}
						<strong>
							as-is, with no warranty of accuracy or fitness for any purpose
						</strong>
						, and is not an authoritative substitute for the official
						publications. Standards change and curated tables can go stale. For
						anything legally or operationally binding, consult the issuing
						authority directly. Corrections are welcome —{" "}
						<a
							href={`${REPO_URL}/issues`}
							target="_blank"
							rel="noopener noreferrer"
							className="text-cyan-700 dark:text-cyan-400 hover:underline"
						>
							open an issue
						</a>
						.
					</p>
				</div>
			</section>

			<section className="mt-10 max-w-4xl">
				<h2 className="text-xl font-semibold mb-2">Open source</h2>
				<p className="text-sm text-muted-foreground">
					The application source code is released under the MIT License. Built with TanStack Start,
					TanStack Table, React 19 and Tailwind CSS.
				</p>
				<nav
					aria-label="Project links"
					className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm"
				>
					{PROJECT_LINKS.map((link) => (
						<a
							key={link.href}
							href={link.href}
							{...(link.external
								? { target: "_blank", rel: "noopener noreferrer" }
								: {})}
							className="text-cyan-700 dark:text-cyan-400 hover:underline"
						>
							{link.label}
						</a>
					))}
				</nav>
			</section>
		</div>
	);
}
