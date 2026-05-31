import type { RegionNameLocale } from "@/data/countries";
import { groupLocaleOptions } from "@/lib/localized-names";

interface LocaleSelectProps {
	/** Element id, paired with the label. */
	id: string;
	/** Currently selected locale code. */
	value: string;
	onChange: (value: string) => void;
	/** Full set of selectable locales. */
	options: RegionNameLocale[];
	/** Visitor's detected locales, surfaced in a "Detected" group on top. */
	detectedLocales: string[];
	/** Override the label classes (e.g. to visually hide it in tight layouts). */
	labelClassName?: string;
	/** Override the wrapper classes (e.g. to stack label over select in a drawer). */
	containerClassName?: string;
}

/**
 * Shared "Show localized names in:" locale picker. Detected locales are grouped on top,
 * the rest below — identical behavior across the countries and languages views.
 */
export function LocaleSelect({
	id,
	value,
	onChange,
	options,
	detectedLocales,
	labelClassName = "text-sm text-muted-foreground whitespace-nowrap",
	containerClassName = "flex items-center gap-2",
}: LocaleSelectProps) {
	const { detected, rest } = groupLocaleOptions(options, detectedLocales);
	const renderOption = (o: RegionNameLocale) => (
		<option key={o.locale} value={o.locale}>
			{o.language} ({o.locale})
		</option>
	);
	return (
		<div className={containerClassName}>
			<label htmlFor={id} className={labelClassName}>
				Show localized names in:
			</label>
			<select
				id={id}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="px-3 py-1 bg-secondary text-secondary-foreground rounded border border-border text-sm"
			>
				{detected.length > 0 ? (
					<>
						<optgroup label="Detected">{detected.map(renderOption)}</optgroup>
						<optgroup label="All locales">{rest.map(renderOption)}</optgroup>
					</>
				) : (
					options.map(renderOption)
				)}
			</select>
		</div>
	);
}
