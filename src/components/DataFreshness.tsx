import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DataVersions } from "@/data/versions";

interface Pill {
	label: string;
	value: string;
	href?: string;
	title?: string;
}

interface PillGroupProps {
	label: string;
	title: string;
	pills: Pill[];
}

function formatDate(iso: string): string {
	try {
		return new Date(iso).toISOString().slice(0, 10);
	} catch {
		return iso;
	}
}

function PillGroup({ label, title, pills }: PillGroupProps) {
	return (
		<div className="flex items-center gap-x-4">
			<Tooltip>
				<TooltipTrigger asChild>
					<span className="font-medium text-muted-foreground uppercase tracking-wide">
						{label}
					</span>
				</TooltipTrigger>
				<TooltipContent className="text-xs">{title}</TooltipContent>
			</Tooltip>
			{pills.map((pill) => {
				const content = (
					<>
						<span className="text-muted-foreground">{pill.label}</span>
						<span className="font-mono">{pill.value}</span>
					</>
				);
				const trigger = pill.href ? (
					<a
						key={pill.label}
						href={pill.href}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
					>
						{content}
					</a>
				) : (
					<span key={pill.label} className="inline-flex items-center gap-1.5">
						{content}
					</span>
				);
				return pill.title ? (
					<Tooltip key={pill.label}>
						<TooltipTrigger asChild>{trigger}</TooltipTrigger>
						<TooltipContent className="text-xs">{pill.title}</TooltipContent>
					</Tooltip>
				) : (
					<span key={pill.label}>{trigger}</span>
				);
			})}
		</div>
	);
}

export function DataFreshness({ versions }: { versions: DataVersions }) {
	// The runtime cluster is "what your JS runtime knows"; the reference cluster
	// is the official/curated data we compare it against — mirroring the app's
	// core runtime-vs-source framing.
	const runtime: Pill[] = [];
	const reference: Pill[] = [];

	runtime.push({
		label: "Node",
		value: versions.node.replace(/^v/, ""),
		title: "Node.js runtime version (drives the Intl API data)",
	});
	if (versions.icu) {
		runtime.push({
			label: "ICU",
			value: versions.icu,
			href: "https://unicode-org.github.io/icu/download/",
			title: "International Components for Unicode version bundled with Node",
		});
	}
	if (versions.unicode) {
		runtime.push({
			label: "Unicode",
			value: versions.unicode,
			href: "https://www.unicode.org/versions/",
			title: "Unicode standard version",
		});
	}

	if (versions.tz) {
		reference.push({
			label: "IANA tzdata",
			value: versions.tz,
			href: "https://www.iana.org/time-zones",
			title: "IANA timezone database version (Node.js runtime)",
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
			title: same
				? "Unicode CLDR version"
				: "Runtime CLDR version vs. the version the curated language data was compiled against",
		});
	}
	reference.push({
		label: "Built",
		value: formatDate(versions.serverStarted),
		title: `Server module initialized at ${versions.serverStarted}`,
	});

	return (
		<footer className="border-t border-border bg-secondary/40 text-secondary-foreground text-xs">
			<div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-x-8 overflow-x-auto whitespace-nowrap">
				<PillGroup
					label="Runtime"
					title="Versions of the JavaScript runtime and the Intl data baked into it"
					pills={runtime}
				/>
				<PillGroup
					label="Reference data"
					title="Versions of the official and curated sources the runtime is compared against"
					pills={reference}
				/>
			</div>
		</footer>
	);
}
