import type { DataVersions } from "@/data/versions";

interface Pill {
	label: string;
	value: string;
	href?: string;
	title?: string;
}

function formatDate(iso: string): string {
	try {
		return new Date(iso).toISOString().slice(0, 10);
	} catch {
		return iso;
	}
}

export function DataFreshness({ versions }: { versions: DataVersions }) {
	const pills: Pill[] = [];

	if (versions.tz) {
		pills.push({
			label: "IANA tzdata",
			value: versions.tz,
			href: "https://www.iana.org/time-zones",
			title: "IANA timezone database version (Node.js runtime)",
		});
	}
	if (versions.cldrRuntime) {
		const same = versions.cldrRuntime.startsWith(versions.cldrCurated);
		pills.push({
			label: "CLDR",
			value: same
				? versions.cldrRuntime
				: `${versions.cldrRuntime} runtime · ${versions.cldrCurated} curated`,
			href: "https://cldr.unicode.org/index/downloads",
			title: same
				? "Unicode CLDR version"
				: "Runtime CLDR version vs. the version the curated language data was compiled against",
		});
	}
	if (versions.unicode) {
		pills.push({
			label: "Unicode",
			value: versions.unicode,
			href: "https://www.unicode.org/versions/",
			title: "Unicode standard version",
		});
	}
	if (versions.icu) {
		pills.push({
			label: "ICU",
			value: versions.icu,
			href: "https://unicode-org.github.io/icu/download/",
			title: "International Components for Unicode version",
		});
	}
	pills.push({
		label: "Node",
		value: versions.node.replace(/^v/, ""),
		title: "Node.js runtime version (drives the Intl API data)",
	});
	pills.push({
		label: "Built",
		value: formatDate(versions.serverStarted),
		title: `Server module initialized at ${versions.serverStarted}`,
	});

	return (
		<footer className="border-t border-border bg-secondary/40 text-secondary-foreground text-xs">
			<div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center gap-x-4 gap-y-2">
				<span className="text-muted-foreground">Data sources:</span>
				{pills.map((pill) => {
					const content = (
						<>
							<span className="text-muted-foreground">{pill.label}</span>
							<span className="font-mono">{pill.value}</span>
						</>
					);
					return pill.href ? (
						<a
							key={pill.label}
							href={pill.href}
							target="_blank"
							rel="noopener noreferrer"
							title={pill.title}
							className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
						>
							{content}
						</a>
					) : (
						<span
							key={pill.label}
							title={pill.title}
							className="inline-flex items-center gap-1.5"
						>
							{content}
						</span>
					);
				})}
			</div>
		</footer>
	);
}
