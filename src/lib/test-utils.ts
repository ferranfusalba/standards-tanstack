/** Unwrap a value that is statically expected to be present, throwing a clear
 *  error if it is not. Intended for tests: lets a fixture lookup that "must"
 *  exist read as a plain value while surfacing a descriptive failure — instead
 *  of a non-null assertion (`!`, banned by Biome) or a silent null-deref — when
 *  the expectation is wrong.
 *
 *  @example const spain = nonNull(byCode.ES, "byCode.ES");
 */
export function nonNull<T>(value: T | null | undefined, label?: string): T {
	if (value == null) {
		throw new Error(
			label
				? `Expected ${label} to be defined`
				: "Expected value to be defined",
		);
	}
	return value;
}
