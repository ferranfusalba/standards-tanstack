import type { Column } from "@tanstack/react-table";
import { Check, Filter } from "lucide-react";
import React from "react";

interface FilterOption {
	value: unknown;
	label: string;
	count: number;
}

interface ColumnFilterProps<TData> {
	column: Column<TData, unknown>;
}

function updatePosition(trigger: HTMLButtonElement, dropdown: HTMLDivElement) {
	const rect = trigger.getBoundingClientRect();
	dropdown.style.top = `${rect.bottom + 4}px`;
	dropdown.style.left = `${rect.left}px`;
}

export function ColumnFilter<TData>({ column }: ColumnFilterProps<TData>) {
	const triggerRef = React.useRef<HTMLButtonElement>(null);
	const popoverRef = React.useRef<HTMLDivElement>(null);

	const meta = column.columnDef.meta as
		| { filterable?: boolean; filterMode?: "presence" | "values" }
		| undefined;
	const isPresenceMode = meta?.filterMode === "presence";

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
				{ value: "empty", label: "(empty)", count: emptyCount },
			];
		}
		const named: FilterOption[] = [];
		let emptyCount = 0;
		for (const [value, count] of facetedValues) {
			if (value === null || value === undefined || value === "") {
				emptyCount += count;
			} else {
				named.push({ value, label: formatValue(value), count });
			}
		}
		named.sort((a, b) => a.label.localeCompare(b.label));
		// Collapse empties into one option with a serializable value (null), so it
		// survives the URL round-trip (undefined would become null there anyway).
		if (emptyCount > 0) {
			named.push({ value: null, label: "(empty)", count: emptyCount });
		}
		return named;
	}, [facetedValues, isPresenceMode]);

	const filterValue = (column.getFilterValue() as unknown[] | undefined) ?? [];
	const isFiltered = filterValue.length > 0;
	const allSelected =
		options.length > 0 &&
		options.every((opt) => filterValue.includes(opt.value));
	// Bulk actions only earn their keep on longer lists; short lists (e.g. the
	// 2-option presence filter) are quicker to toggle directly.
	const showBulkActions = options.length >= 4;

	function selectAll() {
		column.setFilterValue(options.map((opt) => opt.value));
	}

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

	function handleToggle(e: React.MouseEvent) {
		e.stopPropagation();
		const popover = popoverRef.current;
		if (!popover) return;
		if (popover.matches(":popover-open")) {
			popover.hidePopover();
		} else {
			if (triggerRef.current) {
				updatePosition(triggerRef.current, popover);
			}
			popover.showPopover();
		}
	}

	React.useEffect(() => {
		const popover = popoverRef.current;
		const trigger = triggerRef.current;
		if (!popover || !trigger) return;

		function onScroll() {
			if (popover?.matches(":popover-open") && trigger) {
				updatePosition(trigger, popover);
			}
		}
		window.addEventListener("scroll", onScroll, true);
		return () => window.removeEventListener("scroll", onScroll, true);
	}, []);

	return (
		<>
			<button
				ref={triggerRef}
				type="button"
				onClick={handleToggle}
				className={`text-xs hover:bg-accent ${isFiltered ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}
			>
				<Filter
					className="size-3"
					fill={isFiltered ? "currentColor" : "none"}
					aria-hidden="true"
				/>
			</button>
			<div
				ref={popoverRef}
				popover="auto"
				role="listbox"
				className="fixed m-0 w-48 overflow-hidden rounded-md border border-border bg-background text-foreground shadow-lg h-fit font-normal"
			>
				<div className="flex max-h-96 flex-col">
					<div className="p-2 space-y-1 min-h-0 overflow-y-auto">
						{options.map((opt) => {
							const selected = filterValue.includes(opt.value);
							return (
								<button
									key={String(opt.value)}
									type="button"
									onClick={() => toggleValue(opt.value)}
									className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent cursor-pointer text-xs w-full text-left"
								>
									<span
										className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-sm border ${selected ? "bg-foreground border-foreground text-background" : "border-muted-foreground bg-transparent"}`}
									>
										{selected ? (
											<Check
												className="size-2.5"
												strokeWidth={3}
												aria-hidden="true"
											/>
										) : (
											<span className="w-full h-full" />
										)}
									</span>
									<span className="truncate">{opt.label}</span>
									<span className="ml-auto text-muted-foreground">
										{opt.count}
									</span>
								</button>
							);
						})}
					</div>
					{showBulkActions && (
						<div className="flex border-t border-border text-xs">
							<button
								type="button"
								onClick={selectAll}
								disabled={allSelected}
								className="flex-1 px-2 py-1.5 text-center text-muted-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
							>
								Select all
							</button>
							<button
								type="button"
								onClick={() => column.setFilterValue(undefined)}
								disabled={!isFiltered}
								className="flex-1 border-l border-border px-2 py-1.5 text-center text-muted-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
							>
								Reset values
							</button>
						</div>
					)}
				</div>
			</div>
		</>
	);
}

function formatValue(value: unknown): string {
	if (value === null || value === undefined || value === "") return "(empty)";
	if (value === true) return "Yes";
	if (value === false) return "No";
	return String(value);
}
