import { Link, useLocation } from "@tanstack/react-router";
import {
	Coins,
	Globe,
	Home,
	Languages,
	type LucideIcon,
	Map,
	Menu,
	Moon,
	Sun,
	X,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";
import { LocaleSelect } from "./LocaleSelect";

interface NavItem {
	to: string;
	label: string;
	icon: LucideIcon;
	// Home isn't a "view", so it never shows in the "Standards / …" breadcrumb.
	crumb?: boolean;
}

// Single source of truth for the app's navigation. Adding a view here wires up
// BOTH the drawer link and the header breadcrumb — no second list to keep in
// sync. (The route still owns its own `head()` title and `data-view-title`.)
const NAV_ITEMS: NavItem[] = [
	{ to: "/", label: "Home", icon: Home, crumb: false },
	{ to: "/currencies", label: "Currencies", icon: Coins },
	{ to: "/timezones", label: "Timezones", icon: Map },
	{ to: "/countries", label: "Countries", icon: Globe },
	{ to: "/languages", label: "Languages", icon: Languages },
];

// Views whose tables render localized names, so the shared "Show localized names in:"
// picker belongs in the header there (and nowhere else, where it'd be a no-op).
const LOCALE_PICKER_SEGMENTS = new Set(["/countries", "/languages"]);

function usesLocalePicker(pathname: string): boolean {
	const segment = `/${pathname.split("/").filter(Boolean)[0] ?? ""}`;
	return LOCALE_PICKER_SEGMENTS.has(segment);
}

function getViewTitle(pathname: string): string | null {
	// Match the section by its first path segment so nested/child routes
	// (and trailing slashes) still resolve to the correct view name. The
	// home route ("/") and any unmapped path return null -> no breadcrumb.
	const segment = `/${pathname.split("/").filter(Boolean)[0] ?? ""}`;
	const item = NAV_ITEMS.find((i) => i.to === segment);
	return item && item.crumb !== false ? item.label : null;
}

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);
	const [scrolledPast, setScrolledPast] = useState(false);
	const { theme, toggleTheme } = useTheme();
	const { locale, setLocale, options, detectedLocales } = useLocale();
	const location = useLocation();
	const showLocalePicker = usesLocalePicker(location.pathname);
	// Distinct, stable ids so the header and drawer pickers (both in the DOM, one
	// hidden per breakpoint) never collide and each label stays associated.
	const headerLocaleId = useId();
	const drawerLocaleId = useId();

	// Derive the view name synchronously from router state. This is correct on
	// first render (including SSR), updates on every navigation, and can never
	// go stale the way the previous DOM query / IntersectionObserver could.
	const viewTitle = getViewTitle(location.pathname);

	// Scroll-aware reveal: the breadcrumb only appears once the page's in-page
	// heading scrolls up under the sticky 64px header. We still observe that
	// heading, but it now only toggles a boolean — the displayed name comes
	// from router state, not from the observed element's dataset.
	useEffect(() => {
		setScrolledPast(false);
		if (!viewTitle) return;

		let observer: IntersectionObserver | null = null;
		let frame = 0;
		let cancelled = false;
		let attempts = 0;

		function attach() {
			if (cancelled) return;
			const el = document.querySelector<HTMLElement>("[data-view-title]");
			if (el) {
				observer = new IntersectionObserver(
					([entry]) => {
						setScrolledPast(!entry.isIntersecting);
					},
					{ rootMargin: "-64px 0px 0px 0px" },
				);
				observer.observe(el);
				return;
			}
			if (++attempts > 30) return;
			frame = requestAnimationFrame(attach);
		}

		frame = requestAnimationFrame(attach);
		return () => {
			cancelled = true;
			cancelAnimationFrame(frame);
			observer?.disconnect();
		};
	}, [viewTitle]);

	const showViewTitle = viewTitle !== null && scrolledPast;

	return (
		<>
			<header className="sticky top-0 z-40 p-4 flex items-center bg-secondary text-secondary-foreground shadow-lg">
				<button
					onClick={() => setIsOpen(true)}
					className="p-2 hover:bg-accent rounded-lg transition-colors"
					aria-label="Open menu"
				>
					<Menu size={24} />
				</button>
				<h1 className="ml-4 text-xl font-semibold flex-1 flex items-baseline gap-2">
					<Link to="/">Standards</Link>
					<span
						className={`text-muted-foreground font-normal transition-all duration-300 ${
							showViewTitle
								? "opacity-100 translate-x-0"
								: "opacity-0 -translate-x-1 pointer-events-none"
						}`}
						aria-hidden={!showViewTitle}
					>
						/ {viewTitle ?? ""}
					</span>
				</h1>
				{/* On md+ the picker sits inline in the header; below md it moves to
				    the bottom of the nav drawer (rendered there) to save space. */}
				{showLocalePicker && (
					<div className="mr-2 hidden md:block">
						<LocaleSelect
							id={headerLocaleId}
							value={locale}
							onChange={setLocale}
							options={options}
							detectedLocales={detectedLocales}
						/>
					</div>
				)}
				<button
					onClick={toggleTheme}
					className="p-2 hover:bg-accent rounded-lg transition-colors"
					aria-label={
						theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
					}
				>
					{theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
				</button>
			</header>

			<aside
				className={`fixed top-0 left-0 h-full w-80 bg-background text-foreground shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex items-center justify-between p-4 border-b border-border">
					<h2 className="text-xl font-bold">Navigation</h2>
					<button
						onClick={() => setIsOpen(false)}
						className="p-2 hover:bg-accent rounded-lg transition-colors"
						aria-label="Close menu"
					>
						<X size={24} />
					</button>
				</div>

				<nav className="flex-1 p-4 overflow-y-auto">
					{NAV_ITEMS.map(({ to, label, icon: Icon }) => (
						<Link
							key={to}
							to={to}
							onClick={() => setIsOpen(false)}
							className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors mb-2"
							activeProps={{
								className:
									"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition-colors mb-2",
							}}
							// Home matches "/" exactly; section links match their subtree.
							activeOptions={{ exact: to === "/" }}
						>
							<Icon size={20} />
							<span className="font-medium">{label}</span>
						</Link>
					))}
				</nav>

				{/* Small-screen home for the locale picker (hidden in the header below
				    md). `flex-1` on the nav above pins this to the drawer's bottom. */}
				{showLocalePicker && (
					<div className="md:hidden border-t border-border p-4">
						<LocaleSelect
							id={drawerLocaleId}
							value={locale}
							onChange={setLocale}
							options={options}
							detectedLocales={detectedLocales}
							containerClassName="flex flex-col items-start gap-2"
						/>
					</div>
				)}
			</aside>
		</>
	);
}
