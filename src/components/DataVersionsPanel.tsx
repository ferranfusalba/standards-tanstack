import type { DataVersions } from "@/data/versions";

export interface VersionEntry {
	label: string;
	value: string;
	href?: string;
	description: string;
}

export interface VersionGroup {
	label: string;
	blurb: string;
	entries: VersionEntry[];
}

function formatDate(iso: string): string {
	try {
		return new Date(iso).toISOString().slice(0, 10);
	} catch {
		return iso;
	}
}

// The runtime cluster is "what your JS runtime knows"; the reference cluster is
// the official/curated data we compare it against — mirroring the app's core
// runtime-vs-source framing.
export function getVersionGroups(versions: DataVersions): VersionGroup[] {
	const runtime: VersionEntry[] = [
		{
			label: "Node",
			value: versions.node.replace(/^v/, ""),
			description: "Node.js runtime version, which determines the Intl data.",
		},
	];
	if (versions.icu) {
		runtime.push({
			label: "ICU",
			value: versions.icu,
			href: "https://unicode-org.github.io/icu/download/",
			description:
				"International Components for Unicode bundled with this Node build.",
		});
	}
	if (versions.unicode) {
		runtime.push({
			label: "Unicode",
			value: versions.unicode,
			href: "https://www.unicode.org/versions/",
			description: "Version of the Unicode standard the runtime implements.",
		});
	}

	const reference: VersionEntry[] = [];
	if (versions.tz) {
		reference.push({
			label: "IANA tzdata",
			value: versions.tz,
			href: "https://www.iana.org/time-zones",
			description:
				"Timezone database release compiled into the Node.js runtime.",
		});
	}
	if (versions.cldrRuntime) {
		const same = versions.cldrRuntime.startsWith(versions.cldrCurated);
		reference.push({
			label: "CLDR",
			value: same
				? versions.cldrRuntime
				: `${versions.cldrRuntime} runtime · ${versions.cldrCurated} curated`,
			href: "https://cldr.unicode.org/index/downloads",
			description: same
				? "Unicode CLDR release backing the localized names."
				: "Runtime CLDR release vs. the release the curated language data was compiled against. A mismatch is expected and is exactly the kind of divergence this app surfaces.",
		});
	}
	reference.push({
		label: "Built",
		value: formatDate(versions.serverStarted),
		description: `Server module initialized at ${versions.serverStarted}.`,
	});

	return [
		{
			label: "Runtime",
			blurb:
				"Versions of the JavaScript runtime and the Intl data baked into it.",
			entries: runtime,
		},
		{
			label: "Reference data",
			blurb:
				"Versions of the official and curated sources the runtime is compared against.",
			entries: reference,
		},
	];
}

export function DataVersionsPanel({ versions }: { versions: DataVersions }) {
	const groups = getVersionGroups(versions);

	return (
		<div className="grid gap-6 md:grid-cols-2">
			{groups.map((group) => (
				<section
					key={group.label}
					className="rounded-xl border border-border bg-card p-6"
				>
					<h3 className="text-lg font-semibold">{group.label}</h3>
					<p className="mt-1 text-sm text-muted-foreground">{group.blurb}</p>
					<dl className="mt-4 space-y-4">
						{group.entries.map((entry) => (
							<div key={entry.label}>
								<div className="flex items-baseline justify-between gap-4">
									<dt className="font-medium">
										{entry.href ? (
											<a
												href={entry.href}
												target="_blank"
												rel="noopener noreferrer"
												className="text-cyan-700 dark:text-cyan-400 hover:underline"
											>
												{entry.label}
											</a>
										) : (
											entry.label
										)}
									</dt>
									<dd className="font-mono text-sm text-right">
										{entry.value}
									</dd>
								</div>
								<p className="mt-0.5 text-xs text-muted-foreground">
									{entry.description}
								</p>
							</div>
						))}
					</dl>
				</section>
			))}
		</div>
	);
}
