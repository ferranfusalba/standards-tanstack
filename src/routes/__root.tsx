import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { DataFreshness } from "../components/DataFreshness";
import Header from "../components/Header";
import { getRegionNameLocales } from "../data/countries";
import { getDetectedLocales, getPreferredLocale } from "../data/locale";
import { getDataVersions } from "../data/versions";
import StoreDevtools from "../lib/demo-store-devtools";
import { LocaleProvider } from "../lib/locale";
import { ThemeProvider } from "../lib/theme";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
	loader: async () => {
		const [versions, localeOptions, detectedLocales, preferredLocale] =
			await Promise.all([
				getDataVersions(),
				getRegionNameLocales(),
				getDetectedLocales(),
				getPreferredLocale(),
			]);
		return { versions, localeOptions, detectedLocales, preferredLocale };
	},
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Standards",
			},
			{
				name: "description",
				content:
					"Browse and compare international standards: currencies, countries, languages, and timezones.",
			},
			{
				name: "theme-color",
				content: "#0e1525",
			},
			{
				name: "apple-mobile-web-app-capable",
				content: "yes",
			},
			{
				name: "apple-mobile-web-app-status-bar-style",
				content: "black-translucent",
			},
			{
				name: "apple-mobile-web-app-title",
				content: "Standards",
			},
			{
				property: "og:type",
				content: "website",
			},
			{
				property: "og:title",
				content: "Standards",
			},
			{
				property: "og:description",
				content:
					"Browse and compare international standards: currencies, countries, languages, and timezones.",
			},
			{
				property: "og:image",
				content: "/icon-512.png",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "manifest",
				href: "/manifest.json",
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				sizes: "48x48",
			},
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/StandardsLogo.svg",
				sizes: "any",
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "32x32",
				href: "/favicon-32x32.png",
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "16x16",
				href: "/favicon-16x16.png",
			},
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/apple-touch-icon.png",
			},
		],
	}),

	notFoundComponent: () => {
		return (
			<div className="min-h-screen flex items-center justify-center p-6">
				<div className="text-center">
					<h1 className="text-6xl font-bold mb-4">404</h1>
					<p className="text-xl text-muted-foreground mb-6">Page not found</p>
					<a
						href="/"
						className="text-cyan-600 dark:text-cyan-400 hover:underline"
					>
						Go back home
					</a>
				</div>
			</div>
		);
	},

	shellComponent: RootDocument,
});

function RootFooter() {
	const { versions } = Route.useLoaderData();
	return <DataFreshness versions={versions} />;
}

function RootDocument({ children }: { children: React.ReactNode }) {
	const { localeOptions, detectedLocales, preferredLocale } =
		Route.useLoaderData();
	return (
		<html lang="en" className="dark">
			<head>
				<HeadContent />
			</head>
			<body>
				<ThemeProvider>
					<LocaleProvider
						preferredLocale={preferredLocale}
						options={localeOptions}
						detectedLocales={detectedLocales}
					>
						<Header />
						{children}
						<RootFooter />
					</LocaleProvider>
				</ThemeProvider>
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						StoreDevtools,
					]}
				/>
				<Scripts />
				{import.meta.env.PROD && (
					<script
						dangerouslySetInnerHTML={{
							__html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
						}}
					/>
				)}
			</body>
		</html>
	);
}
