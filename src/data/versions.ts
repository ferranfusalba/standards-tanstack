import { createServerFn } from "@tanstack/react-start";

export interface DataVersions {
	node: string;
	icu?: string;
	unicode?: string;
	cldrRuntime?: string;
	cldrCurated: string;
	tz?: string;
	serverStarted: string;
}

const SERVER_STARTED = new Date().toISOString();
const CLDR_CURATED = "48"; // Hand-curated CLDR variants in src/data/languages.ts

export const getDataVersions = createServerFn({ method: "GET" }).handler(
	async (): Promise<DataVersions> => {
		const versions = process.versions as NodeJS.ProcessVersions & {
			icu?: string;
			unicode?: string;
			cldr?: string;
			tz?: string;
		};
		return {
			node: process.version,
			icu: versions.icu,
			unicode: versions.unicode,
			cldrRuntime: versions.cldr,
			cldrCurated: CLDR_CURATED,
			tz: versions.tz,
			serverStarted: SERVER_STARTED,
		};
	},
);
