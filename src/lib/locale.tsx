import { createContext, useContext, useEffect, useState } from "react";
import type { RegionNameLocale } from "@/data/countries";

interface LocaleContextValue {
	/** Currently selected display locale (e.g. "ca"). */
	locale: string;
	setLocale: (next: string) => void;
	/** Full set of selectable locales, for the picker. */
	options: RegionNameLocale[];
	/** Visitor's detected locales, surfaced in a "Detected" group on top. */
	detectedLocales: string[];
}

const LocaleContext = createContext<LocaleContextValue>({
	locale: "en",
	setLocale: () => {},
	options: [],
	detectedLocales: [],
});

const STORAGE_KEY = "nameLocale";

/**
 * App-wide "Show localized names in:" locale, shared across the countries and languages
 * views so the choice stays in sync between them. Mirrors {@link ThemeProvider}:
 * seeded with the server-detected locale for a correct first paint, then a
 * returning visitor's stored choice is applied on mount and persisted to
 * localStorage on every change.
 */
export function LocaleProvider({
	children,
	preferredLocale,
	options,
	detectedLocales,
}: {
	children: React.ReactNode;
	preferredLocale: string;
	options: RegionNameLocale[];
	detectedLocales: string[];
}) {
	const [locale, setLocaleState] = useState(preferredLocale);

	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) setLocaleState(stored);
	}, []);

	const setLocale = (next: string) => {
		setLocaleState(next);
		localStorage.setItem(STORAGE_KEY, next);
	};

	return (
		<LocaleContext value={{ locale, setLocale, options, detectedLocales }}>
			{children}
		</LocaleContext>
	);
}

export function useLocale() {
	return useContext(LocaleContext);
}
