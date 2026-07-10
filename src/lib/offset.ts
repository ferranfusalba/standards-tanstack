/**
 * Parse a `UTC±HH[:MM]` offset string into signed minutes.
 *
 * `"UTC-05" → -300`, `"UTC+05:30" → 330`, `"UTC-03:30" → -210`,
 * `"UTC+0" / "UTC" / malformed → 0`.
 *
 * Use this to sort and compare timezone offsets numerically. A lexicographic
 * string compare wrongly orders negative offsets — e.g. `"UTC-05" > "UTC-04"`
 * (because `'5' > '4'`) even though -05:00 is numerically the smaller offset.
 */
export function parseUtcOffsetMinutes(offset: string): number {
	const match = offset.match(/UTC([+-]?\d+)(?::(\d+))?/);
	if (!match) return 0;
	// Group 1 (`[+-]?\d+`) is mandatory, so it's present whenever the match succeeds.
	const hoursStr = match[1] ?? "0";
	const hours = Number.parseInt(hoursStr, 10);
	const minutes = Number.parseInt(match[2] ?? "0", 10);
	// Derive the sign from the string, not from `hours`: parsing "-00" yields -0,
	// and `-0 < 0` is false, which would flip the sign of a "UTC-00:30" offset.
	const sign = hoursStr.startsWith("-") ? -1 : 1;
	return hours * 60 + sign * minutes;
}
