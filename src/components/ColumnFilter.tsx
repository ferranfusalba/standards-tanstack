import type { Column } from "@tanstack/react-table";
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
        className={`text-xs hover:bg-accent ${isFiltered ? "text-blue-400" : "text-muted-foreground"}`}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill={isFiltered ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <title>Filter</title>
          <path d="M1.5 3h13L9.5 9.5V14l-3 1.5V9.5z" />
        </svg>
      </button>
      <div
        ref={popoverRef}
        popover="auto"
        role="listbox"
        className="fixed m-0 w-48 rounded-md border border-border bg-background text-foreground shadow-lg h-fit max-h-96"
      >
        <div className="p-2 space-y-1 h-fit max-h-96 overflow-y-auto">
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
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      aria-hidden="true"
                    >
                      <title>Selected</title>
                      <path d="M3 8l3.5 3.5L13 5" />
                    </svg>
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
