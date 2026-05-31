import {
	type ColumnDef,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { fuzzyFilter } from "../../lib/fuzzy-filter";
import { DataTable } from "../DataTable";

afterEach(cleanup);

interface Row {
	code: string;
	name: string;
}

const data: Row[] = [
	{ code: "AD", name: "Andorra" },
	{ code: "AE", name: "United Arab Emirates" },
];

const columns: ColumnDef<Row>[] = [
	{ accessorKey: "code", header: "Code" },
	{ accessorKey: "name", header: "Name" },
];

function Harness({
	columnSources,
	sourceMeta,
}: {
	columnSources?: Record<string, string>;
	sourceMeta?: Record<string, { href?: string; note?: string }>;
}) {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		filterFns: { fuzzy: fuzzyFilter },
	});
	return (
		<DataTable
			table={table}
			columnSources={columnSources}
			sourceMeta={sourceMeta}
		/>
	);
}

describe("DataTable source row", () => {
	it("renders a second header row with each column's source label", () => {
		const { container } = render(
			<Harness columnSources={{ code: "ISO 3166-1", name: "Unicode CLDR" }} />,
		);
		// Two thead rows: the column titles, then the sources beneath them.
		expect(container.querySelectorAll("thead tr")).toHaveLength(2);
		expect(screen.getByText("ISO 3166-1")).toBeDefined();
		expect(screen.getByText("Unicode CLDR")).toBeDefined();
	});

	it("omits the source row entirely when no columnSources are provided", () => {
		const { container } = render(<Harness />);
		expect(container.querySelectorAll("thead tr")).toHaveLength(1);
	});

	it("omits the source row when no visible column has a source entry", () => {
		const { container } = render(
			<Harness columnSources={{ notAColumn: "x" }} />,
		);
		expect(container.querySelectorAll("thead tr")).toHaveLength(1);
	});

	it("links a source label that has an href and leaves the rest as plain text", () => {
		render(
			<Harness
				columnSources={{ code: "ISO 3166-1", name: "Unicode CLDR" }}
				sourceMeta={{ "ISO 3166-1": { href: "https://example.test/iso" } }}
			/>,
		);
		const link = screen.getByRole("link", { name: "ISO 3166-1" });
		expect(link.getAttribute("href")).toBe("https://example.test/iso");
		expect(link.getAttribute("target")).toBe("_blank");
		// A source without an href renders as text, not a link.
		expect(screen.queryByRole("link", { name: "Unicode CLDR" })).toBeNull();
		expect(screen.getByText("Unicode CLDR")).toBeDefined();
	});

	it("renders an info-tooltip trigger for a source label that has a note", () => {
		render(
			<Harness
				columnSources={{ code: "ISO 3166-1", name: "Unicode CLDR" }}
				sourceMeta={{ "ISO 3166-1": { note: "See section 4." } }}
			/>,
		);
		// The note's trigger is an accessible button; the label without a note has none.
		expect(
			screen.getByRole("button", { name: "About ISO 3166-1" }),
		).toBeDefined();
		expect(
			screen.queryByRole("button", { name: "About Unicode CLDR" }),
		).toBeNull();
	});
});
