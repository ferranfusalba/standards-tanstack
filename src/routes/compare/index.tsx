import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { ArrowRight, FileText, TriangleAlert, Upload, X } from "lucide-react";
import React from "react";
import { ColumnVisibility } from "@/components/ColumnVisibility";
import { DataTable } from "@/components/DataTable";
import { Pagination } from "@/components/Pagination";
import { getCountriesFromUN } from "@/data/countries";
import { getCurrencies } from "@/data/currencies";
import { getLanguages } from "@/data/languages";
import { getTimezonesFromIntl } from "@/data/timezones";
import { DATASET_CONFIGS, DATASET_ORDER } from "@/lib/compare/dataset-config";
import { compareDataset, proposeSpec, uploadHeaders } from "@/lib/compare/diff";
import { CompareParseError, parseUpload } from "@/lib/compare/parse";
import type {
	CompareResult,
	CompareSpec,
	DatasetKey,
	RowComparison,
	RowStatus,
} from "@/lib/compare/types";
import { exportRowsCSV, exportRowsJSON } from "@/lib/export";
import { fuzzyFilter } from "@/lib/fuzzy-filter";
import { DEFAULT_PAGE_SIZE } from "@/lib/url-state";

type AnyRecord = Record<string, unknown>;

export const Route = createFileRoute("/compare/")({
	component: Compare,
	loader: async () => {
		const [countries, currencies, languages, timezones] = await Promise.all([
			getCountriesFromUN(),
			getCurrencies(),
			getLanguages(),
			getTimezonesFromIntl(),
		]);
		return { countries, currencies, languages, timezones };
	},
	head: () => ({
		meta: [
			{ title: "Compare your data | Standards" },
			{
				name: "description",
				content:
					"Upload your own JSON or CSV list of countries, currencies, languages, or timezones and compare it field-by-field against canonical ISO/IANA data. Map any column to any field and choose what to match on. Everything runs in your browser — your file never leaves your device.",
			},
		],
	}),
});

const STATUS_META: Record<
	RowStatus,
	{ label: string; badge: string; priority: number }
> = {
	changed: {
		label: "Different",
		badge: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
		priority: 0,
	},
	missing: {
		label: "Missing",
		badge: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
		priority: 1,
	},
	extra: {
		label: "Extra",
		badge: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
		priority: 2,
	},
	identical: {
		label: "Identical",
		badge:
			"bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
		priority: 3,
	},
};

const STATUS_ORDER: RowStatus[] = ["changed", "missing", "extra", "identical"];

function StatusBadge({ status }: { status: RowStatus }) {
	return (
		<span
			className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_META[status].badge}`}
		>
			{STATUS_META[status].label}
		</span>
	);
}

function flattenForExport(rows: RowComparison[]): AnyRecord[] {
	return rows.map((row) => ({
		status: row.status,
		key: row.key,
		name: row.name,
		matchedBy: row.matchedBy ?? "",
		differences: row.diffs
			.map((d) => `${d.field}: ${d.ours || "∅"} -> ${d.theirs || "∅"}`)
			.join("; "),
	}));
}

const SELECT_CLASS =
	"bg-background border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-ring";

function Compare() {
	const canonical = Route.useLoaderData();

	const [dataset, setDataset] = React.useState<DatasetKey>("countries");
	const [rawRecords, setRawRecords] = React.useState<AnyRecord[] | null>(null);
	const [spec, setSpec] = React.useState<CompareSpec | null>(null);
	const [fileName, setFileName] = React.useState<string | null>(null);
	const [error, setError] = React.useState<string | null>(null);
	const [dragOver, setDragOver] = React.useState(false);
	const [globalFilter, setGlobalFilter] = React.useState("");
	const [activeStatuses, setActiveStatuses] = React.useState<Set<RowStatus>>(
		() => new Set(STATUS_ORDER),
	);
	const [sorting, setSorting] = React.useState<SortingState>([
		{ id: "status", desc: false },
	]);
	const [pagination, setPagination] = React.useState({
		pageIndex: 0,
		pageSize: DEFAULT_PAGE_SIZE,
	});

	const config = DATASET_CONFIGS[dataset];

	const headers = React.useMemo(
		() => (rawRecords ? uploadHeaders(rawRecords) : []),
		[rawRecords],
	);

	// A pretty-printed peek at the upload's shape, shown beside the mapping so the
	// user can see the columns and example values they're mapping against.
	const preview = React.useMemo(
		() =>
			rawRecords && rawRecords.length > 0
				? JSON.stringify(rawRecords[0], null, 2)
				: "",
		[rawRecords],
	);

	// Seed the (user-editable) spec from a name-agnostic first analysis whenever a
	// new file is loaded or the target dataset changes. User edits to `spec` don't
	// re-trigger this — the effect doesn't depend on `spec`.
	// biome-ignore lint/correctness/useExhaustiveDependencies: re-propose only on file/dataset change, not on user edits to spec
	React.useEffect(() => {
		if (!rawRecords) {
			setSpec(null);
			return;
		}
		const ours = canonical[dataset] as unknown as AnyRecord[];
		setSpec(proposeSpec(config, ours, rawRecords));
	}, [dataset, rawRecords, canonical]);

	const result = React.useMemo<CompareResult | null>(() => {
		if (!rawRecords || !spec) return null;
		const ours = canonical[dataset] as unknown as AnyRecord[];
		return compareDataset(config, ours, rawRecords, spec);
	}, [config, dataset, rawRecords, spec, canonical]);

	const visibleRows = React.useMemo(
		() => result?.rows.filter((r) => activeStatuses.has(r.status)) ?? [],
		[result, activeStatuses],
	);

	// Return to the first page whenever the underlying view changes.
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally re-pages on any view change
	React.useEffect(() => {
		setPagination((p) => ({ ...p, pageIndex: 0 }));
	}, [dataset, rawRecords, spec, globalFilter, activeStatuses]);

	const handleFile = React.useCallback(async (file: File) => {
		setFileName(file.name);
		try {
			const text = await file.text();
			const parsed = parseUpload(text, { filename: file.name });
			setRawRecords(parsed.records);
			setError(null);
		} catch (e) {
			setRawRecords(null);
			setError(
				e instanceof CompareParseError ? e.message : "Could not read the file.",
			);
		}
	}, []);

	const clearFile = () => {
		setRawRecords(null);
		setFileName(null);
		setError(null);
	};

	const fieldLabel = (field: string) =>
		config.compareFields.find((f) => f.field === field)?.label ?? field;

	const setFieldColumn = (field: string, header: string) =>
		setSpec((s) => {
			if (!s) return s;
			const mapping = { ...s.mapping };
			if (header) mapping[field] = header;
			else delete mapping[field];
			// If the match field lost its column, fall back to another mapped field.
			let primary = s.primary;
			if (!(primary.field in mapping)) {
				const next = Object.keys(mapping)[0];
				primary = next
					? { field: next, mode: next === config.nameField ? "fuzzy" : "exact" }
					: primary;
			}
			return { ...s, mapping, primary };
		});

	const setMatchField = (field: string) =>
		setSpec((s) =>
			s
				? {
						...s,
						primary: {
							field,
							mode: field === config.nameField ? "fuzzy" : "exact",
						},
					}
				: s,
		);

	const setMatchMode = (mode: "exact" | "fuzzy") =>
		setSpec((s) => (s ? { ...s, primary: { ...s.primary, mode } } : s));

	const toggleStatus = (status: RowStatus) => {
		setActiveStatuses((prev) => {
			const next = new Set(prev);
			if (next.has(status)) next.delete(status);
			else next.add(status);
			return next.size === 0 ? new Set(STATUS_ORDER) : next;
		});
	};

	const keyLabel = fieldLabel(config.primaryKey);

	const columns = React.useMemo<ColumnDef<RowComparison>[]>(
		() => [
			{
				accessorKey: "status",
				header: "Status",
				size: 90,
				maxSize: 90,
				enableHiding: false,
				cell: (info) => <StatusBadge status={info.getValue<RowStatus>()} />,
				sortingFn: (a, b) =>
					STATUS_META[a.original.status].priority -
					STATUS_META[b.original.status].priority,
			},
			{
				accessorKey: "key",
				header: keyLabel,
				size: 110,
				maxSize: 110,
				enableHiding: false,
				cell: (info) => (
					<span className="font-mono text-xs">
						{info.getValue<string>() || "—"}
					</span>
				),
			},
			{
				accessorKey: "name",
				header: "Name",
				size: 180,
				maxSize: 180,
			},
			{
				id: "matchedBy",
				header: "Matched",
				size: 110,
				maxSize: 110,
				accessorFn: (row) =>
					row.matchedBy === "name"
						? "by name"
						: row.matchedBy === "key"
							? `by ${row.matchedField}`
							: "",
				cell: (info) => {
					const v = info.getValue<string>();
					return v ? (
						<span className="text-xs text-muted-foreground">{v}</span>
					) : null;
				},
			},
			{
				id: "differences",
				header: "Differences",
				size: 380,
				maxSize: 380,
				enableSorting: false,
				accessorFn: (row) =>
					row.diffs.map((d) => `${d.label} ${d.ours} ${d.theirs}`).join(" "),
				cell: (info) => {
					const row = info.row.original;
					if (row.status === "identical")
						return <span className="text-muted-foreground">Matches</span>;
					if (row.status === "missing")
						return (
							<span className="text-muted-foreground">Not in your file</span>
						);
					if (row.status === "extra")
						return (
							<span className="text-muted-foreground">Not in our data</span>
						);
					return (
						<div className="flex flex-col gap-0.5 py-1">
							{row.diffs.map((d) => (
								<div
									key={d.field}
									className="flex flex-wrap items-baseline gap-1.5 text-xs"
								>
									<span className="text-muted-foreground">{d.label}:</span>
									<span className="text-muted-foreground line-through">
										{d.ours || "∅"}
									</span>
									<ArrowRight className="size-3 text-muted-foreground/60" />
									<span className="font-medium text-amber-700 dark:text-amber-300">
										{d.theirs || "∅"}
									</span>
								</div>
							))}
						</div>
					);
				},
			},
		],
		[keyLabel],
	);

	const table = useReactTable({
		data: visibleRows,
		columns,
		getRowId: (row) => row.id,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		globalFilterFn: "fuzzy",
		state: { globalFilter, sorting, pagination },
		onGlobalFilterChange: setGlobalFilter,
		onSortingChange: setSorting,
		onPaginationChange: setPagination,
		filterFns: { fuzzy: fuzzyFilter },
	});

	const matchedCount = result
		? result.summary.identical + result.summary.changed
		: 0;

	return (
		<div className="min-h-screen p-6">
			<h1
				className="text-3xl font-bold mb-2"
				data-view-title="Compare your data"
			>
				Compare your data
			</h1>
			<p className="text-sm text-muted-foreground mb-6 max-w-3xl">
				Upload your own JSON or CSV list and diff it field-by-field against the
				canonical data here. Matching ignores column names — map any column to
				any field and pick what to match on. Everything runs in your browser —
				your file never leaves your device.
			</p>

			{/* Dataset selector */}
			<div className="flex flex-wrap gap-2 mb-4">
				{DATASET_ORDER.map((key) => (
					<button
						key={key}
						type="button"
						onClick={() => setDataset(key)}
						aria-pressed={dataset === key}
						className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
							dataset === key
								? "bg-cyan-600 text-white border-cyan-600"
								: "bg-secondary text-secondary-foreground border-border hover:bg-accent"
						}`}
					>
						{DATASET_CONFIGS[key].label}
					</button>
				))}
			</div>

			{/* Dropzone */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop wrapper; the labelled file input inside is the real control */}
			<div
				onDragOver={(e) => {
					e.preventDefault();
					setDragOver(true);
				}}
				onDragLeave={() => setDragOver(false)}
				onDrop={(e) => {
					e.preventDefault();
					setDragOver(false);
					const file = e.dataTransfer.files?.[0];
					if (file) void handleFile(file);
				}}
				className={`rounded-lg border-2 border-dashed p-6 mb-4 transition-colors ${
					dragOver ? "border-cyan-500 bg-accent" : "border-border"
				}`}
			>
				<label className="flex flex-col items-center justify-center gap-2 cursor-pointer text-center">
					<Upload className="size-6 text-muted-foreground" />
					<span className="text-sm font-medium">
						Drop a {config.label.toLowerCase()} file here, or click to choose
					</span>
					<span className="text-xs text-muted-foreground">
						Accepts .json or .csv
					</span>
					<input
						type="file"
						accept=".json,.csv,application/json,text/csv"
						// Inline `display:none` (not just the `hidden` class) so the native
						// "Choose File / No file chosen" control never flashes before CSS
						// loads. The wrapping <label> still opens the picker on click.
						style={{ display: "none" }}
						aria-label={`Upload a ${config.label} file to compare`}
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (file) void handleFile(file);
							e.target.value = "";
						}}
					/>
				</label>
			</div>

			{fileName && (
				<div className="flex items-center gap-2 text-sm mb-4">
					<FileText className="size-4 text-muted-foreground" />
					<span className="font-medium">{fileName}</span>
					{result && (
						<span className="text-muted-foreground">
							· {result.summary.theirCount} records
						</span>
					)}
					<button
						type="button"
						onClick={clearFile}
						className="ml-1 p-1 rounded hover:bg-accent"
						aria-label="Clear uploaded file"
					>
						<X className="size-3.5" />
					</button>
				</div>
			)}

			{error && (
				<div className="flex items-start gap-2 rounded-md border border-rose-300 bg-rose-50 dark:border-rose-900 dark:bg-rose-950 p-3 mb-4 text-sm text-rose-800 dark:text-rose-300">
					<TriangleAlert className="size-4 mt-0.5 shrink-0" />
					<span>{error}</span>
				</div>
			)}

			{spec && result && (
				<>
					{/* Column mapping & match key — seeded by analysis, fully editable */}
					<details className="mb-4 rounded-lg border border-border" open>
						<summary className="cursor-pointer px-3 py-2 text-sm font-medium select-none">
							Column mapping & match key
						</summary>
						<div className="border-t border-border p-3">
							<p className="text-xs text-muted-foreground mb-3">
								We guessed how your columns line up by looking at their{" "}
								<em>values</em>, not their names. Adjust anything below and the
								results update instantly.
							</p>
							<div className="grid gap-4 lg:grid-cols-4">
								{/* Left: a peek at the uploaded structure to map against */}
								<div className="lg:col-span-1 min-w-0">
									<div className="text-xs font-medium text-muted-foreground mb-1">
										Your file{" "}
										<span className="font-normal">
											(first of {result.summary.theirCount})
										</span>
									</div>
									<pre className="rounded-md border border-border bg-secondary/50 p-3 text-xs font-mono leading-relaxed overflow-auto max-h-72 text-foreground">
										<code>{preview}</code>
									</pre>
								</div>

								{/* Right: the editable mapping + match key */}
								<div className="lg:col-span-3 min-w-0">
									<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-3 mb-4">
										{config.compareFields.map((fc) => (
											<label
												key={fc.field}
												className="flex flex-col gap-1 min-w-0 text-sm"
											>
												<span
													className="text-xs text-muted-foreground truncate"
													title={fc.label}
												>
													{fc.label}
												</span>
												<select
													value={spec.mapping[fc.field] ?? ""}
													onChange={(e) =>
														setFieldColumn(fc.field, e.target.value)
													}
													className={`${SELECT_CLASS} w-full`}
												>
													<option value="">— none —</option>
													{headers.map((h) => (
														<option key={h} value={h}>
															{h}
														</option>
													))}
												</select>
											</label>
										))}
									</div>
									<div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm border-t border-border pt-3">
										<span className="font-medium">Match rows on:</span>
										<select
											value={spec.primary.field}
											onChange={(e) => setMatchField(e.target.value)}
											aria-label="Field to match rows on"
											className={SELECT_CLASS}
										>
											{Object.keys(spec.mapping).map((f) => (
												<option key={f} value={f}>
													{fieldLabel(f)} ← {spec.mapping[f]}
												</option>
											))}
										</select>
										<label className="flex items-center gap-1.5 text-muted-foreground">
											<input
												type="checkbox"
												checked={spec.primary.mode === "fuzzy"}
												onChange={(e) =>
													setMatchMode(e.target.checked ? "fuzzy" : "exact")
												}
											/>
											fuzzy (match by similarity)
										</label>
									</div>
								</div>
							</div>
						</div>
					</details>

					{matchedCount === 0 && (
						<div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950 p-3 mb-4 text-sm text-amber-800 dark:text-amber-300">
							<TriangleAlert className="size-4 mt-0.5 shrink-0" />
							<span>
								No rows matched on{" "}
								<strong>{fieldLabel(spec.primary.field)}</strong>. Pick a
								different match column above, or toggle fuzzy matching.
							</span>
						</div>
					)}

					{/* Summary chips (click to filter) */}
					<div className="flex flex-wrap gap-2 mb-4">
						{STATUS_ORDER.map((status) => {
							const active = activeStatuses.has(status);
							return (
								<button
									key={status}
									type="button"
									onClick={() => toggleStatus(status)}
									aria-pressed={active}
									className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
										active
											? "border-border bg-secondary"
											: "border-border bg-background text-muted-foreground opacity-60"
									}`}
								>
									<span className="font-semibold">
										{result.summary[status]}
									</span>{" "}
									{STATUS_META[status].label}
								</button>
							);
						})}
					</div>

					{result.columns.unmapped.length > 0 && (
						<p className="text-xs text-muted-foreground mb-4">
							Ignored columns: {result.columns.unmapped.join(", ")}
						</p>
					)}

					<input
						type="text"
						value={globalFilter}
						onChange={(e) => setGlobalFilter(e.target.value)}
						placeholder="Search by name, code or difference…"
						aria-label="Search comparison results"
						className="w-full px-3 py-2 mb-4 bg-secondary border border-border rounded text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-ring"
					/>

					<div className="flex items-center justify-between mb-2">
						<p className="text-sm text-muted-foreground">
							Showing {visibleRows.length} of {result.summary.total} rows
						</p>
						<div className="flex items-center gap-2">
							<ColumnVisibility table={table} />
							<div className="flex gap-1">
								<button
									type="button"
									onClick={() =>
										exportRowsCSV(
											flattenForExport(result.rows),
											`compare-${dataset}.csv`,
										)
									}
									className="px-2 py-1 text-xs bg-secondary text-secondary-foreground border border-border rounded hover:bg-accent"
								>
									CSV
								</button>
								<button
									type="button"
									onClick={() =>
										exportRowsJSON(
											flattenForExport(result.rows),
											`compare-${dataset}.json`,
										)
									}
									className="px-2 py-1 text-xs bg-secondary text-secondary-foreground border border-border rounded hover:bg-accent"
								>
									JSON
								</button>
							</div>
						</div>
					</div>

					<DataTable
						table={table}
						cellClassName={(_col, row) => {
							const status = row.original.status;
							if (status === "changed")
								return "bg-amber-50/60 dark:bg-amber-950/30";
							if (status === "missing")
								return "bg-rose-50/60 dark:bg-rose-950/30";
							return "";
						}}
					/>
					<Pagination table={table} totalItems={visibleRows.length} />
				</>
			)}
		</div>
	);
}
