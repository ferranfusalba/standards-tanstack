import { createFileRoute, Link } from "@tanstack/react-router";
import { Coins, Globe, Languages, Map as MapIcon } from "lucide-react";

export const Route = createFileRoute("/")({
	component: App,
	head: () => ({
		meta: [
			{
				title: "Standards - International Standards Browser",
			},
			{
				name: "description",
				content:
					"Browse and compare international standards: ISO 4217 currencies, ISO 3166 countries, ISO 639 languages, and IANA timezones.",
			},
		],
	}),
});

function App() {
	const pages = [
		{
			icon: <Coins className="w-12 h-12 text-cyan-500 dark:text-cyan-400" />,
			title: "Currencies",
			standards: [
				"JS Intl.NumberFormat (symbols)",
				"ISO 4217 List One (active)",
				"ISO 4217 List Three (historical)",
			],
			path: "/currencies",
		},
		{
			icon: <MapIcon className="w-12 h-12 text-cyan-500 dark:text-cyan-400" />,
			title: "Timezones",
			standards: ["JS Intl API", "IANA tzdata"],
			path: "/timezones",
		},
		{
			icon: <Globe className="w-12 h-12 text-cyan-500 dark:text-cyan-400" />,
			title: "Countries",
			standards: [
				"JS Intl API",
				"ISO 3166-1 (Alpha-2/3, numeric)",
				"ISO 3166-2 (subdivisions)",
				"UN M49 (regions, membership)",
				"ICAO 9303 (passport codes)",
				"DSIT (vehicle codes)",
				"IOC (Olympic codes)",
				"ITU (aircraft registration prefixes)",
			],
			path: "/countries",
		},
		{
			icon: (
				<Languages className="w-12 h-12 text-cyan-500 dark:text-cyan-400" />
			),
			title: "Languages",
			standards: [
				"JS Intl.DisplayNames",
				"ISO 639-1",
				"IANA BCP 47 Subtag Registry",
				"Unicode CLDR",
			],
			path: "/languages",
		},
	];

	return (
		<div className="min-h-screen bg-background">
			<section className="bg-cyan-400 dark:bg-cyan-500 py-24 px-6 text-center">
				<div className="max-w-5xl mx-auto">
					<h1 className="text-6xl md:text-8xl font-black mb-6 text-slate-900">
						Standards
					</h1>
					<p className="text-2xl md:text-3xl text-slate-900/80 mb-4 font-light">
						Explore international standards data
					</p>
					<p className="text-lg text-slate-900/70 max-w-3xl mx-auto">
						Side-by-side views of what your JavaScript runtime knows versus
						official sources.
					</p>
				</div>
			</section>

			<section className="py-16 px-6 max-w-7xl mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{pages.map((page) => (
						<Link
							key={page.path}
							to={page.path}
							className="bg-card border border-border rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 block"
						>
							<div className="mb-4">{page.icon}</div>
							<h3 className="text-xl font-semibold mb-3">{page.title}</h3>
							<ul className="text-sm text-muted-foreground space-y-1">
								{page.standards.map((s) => (
									<li key={s} className="flex gap-2">
										<span aria-hidden="true">•</span>
										<span>{s}</span>
									</li>
								))}
							</ul>
						</Link>
					))}
				</div>
			</section>
		</div>
	);
}
