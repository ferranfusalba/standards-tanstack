import type { Column } from "@tanstack/react-table";
import React from "react";
import { createPortal } from "react-dom";

interface FilterOption {
	value: unknown;
	label: string;
	count: number;
}

interface ColumnFilterProps<TData> {
	column: Column<TData, unknown>;
}

export function ColumnFilter<TData>({ column }: ColumnFilterProps<TData>) {
	const [open, setOpen] = React.useState(false);
	const buttonRef = React.useRef<HTMLButtonElement>(null);
	const dropdownRef = React.useRef<HTMLDivElement>(null);
	const [position, setPosition] = React.useState({ top: 0, left: 0 });

	const meta = column.columnDef.meta as
		| { filterable?: boolean; filterMode?: "presence" | "values" }
		| undefined;
	const isPresenceMode = meta?.filterMode === "presence";

	React.useEffect(() => {
		if (!open) return;

		function updatePosition() {
			if (buttonRef.current) {
				const rect = buttonRef.current.getBoundingClientRect();
				setPosition({
					top: rect.bottom + 4,
					left: rect.left,
				});
			}
		}

		function handleClickOutside(e: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target as Node) &&
				buttonRef.current &&
				!buttonRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		}

		updatePosition();
		document.addEventListener("mousedown", handleClickOutside);
		window.addEventListener("scroll", updatePosition, true);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			window.removeEventListener("scroll", updatePosition, true);
		};
	}, [open]);

	const facetedValues = column.getFacetedUniqueValues();

	const options = React.useMemo<FilterOption[]>(() => {
		if (isPresenceMode) {
			let hasValueCount = 0;
			let emptyCount = 0;
			for (const [value, count] of facetedValues) {
				if (value === null || value === undefined || value === "") {
					emptyCount += count;
				} else {
					hasValueCount += count;
				}
			}
			return [
				{ value: "has-value", label: "Has value", count: hasValueCount },
				{ value: "empty", label: "Empty", count: emptyCount },
			];
		}
		return [...facetedValues.entries()]
			.sort((a, b) => formatValue(a[0]).localeCompare(formatValue(b[0])))
			.map(([value, count]) => ({
				value,
				label: formatValue(value),
				count,
			}));
	}, [facetedValues, isPresenceMode]);

	const filterValue = (column.getFilterValue() as unknown[] | undefined) ?? [];
	const isFiltered = filterValue.length > 0;

	function toggleValue(val: unknown) {
		const current = [...filterValue];
		const idx = current.indexOf(val);
		if (idx >= 0) {
			current.splice(idx, 1);
		} else {
			current.push(val);
		}
		column.setFilterValue(current.length > 0 ? current : undefined);
	}

	return (
		<>
			<button
				ref={buttonRef}
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					setOpen((v) => !v);
				}}
				className={`ml-1 px-1 py-0.5 rounded text-xs hover:bg-accent ${isFiltered ? "text-blue-400" : "text-muted-foreground"}`}
			>
				<svg
					width="12"
					height="12"
					viewBox="0 0 16 16"
					fill={isFiltered ? "currentColor" : "none"}
					stroke="currentColor"
					strokeWidth="1.5"
					aria-hidden="true"
					role="img"
					aria-label="Filter"
				>
					<title>Filter</title>
					<path d="M1.5 3h13L9.5 9.5V14l-3 1.5V9.5z" />
				</svg>
			</button>
			{open &&
				createPortal(
					// biome-ignore lint/a11y/noStaticElementInteractions: stopPropagation prevents sort toggle when clicking filter
					<div
						ref={dropdownRef}
						className="fixed z-50 w-48 rounded-lg border border-border bg-background shadow-lg"
						style={{ top: position.top, left: position.left }}
						onClick={(e) => e.stopPropagation()}
						onKeyDown={(e) => e.stopPropagation()}
					>
						<div className="p-2 space-y-1 max-h-[calc(100vh-8rem)] overflow-y-auto">
							{options.map((opt) => (
								<label
									key={String(opt.value)}
									className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent cursor-pointer text-xs"
								>
									<input
										type="checkbox"
										checked={filterValue.includes(opt.value)}
										onChange={() => toggleValue(opt.value)}
										className="rounded"
									/>
									<span className="truncate">{opt.label}</span>
									<span className="ml-auto text-muted-foreground">
										{opt.count}
									</span>
								</label>
							))}
							{isFiltered && (
								<button
									type="button"
									onClick={() => column.setFilterValue(undefined)}
									className="w-full px-2 py-1 mt-1 pt-1 border-t border-border text-xs rounded hover:bg-accent text-muted-foreground text-left"
								>
									Clear filter
								</button>
							)}
						</div>
					</div>,
					document.body,
				)}
		</>
	);
}

function formatValue(value: unknown): string {
	if (value === null || value === undefined || value === "") return "(empty)";
	if (value === true) return "Yes";
	if (value === false) return "No";
	return String(value);
}
