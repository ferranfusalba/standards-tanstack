import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, type Plugin } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

// transformers.js (semantic matching) is browser-only and lazy-loaded on the
// client. Its Node entry pulls in onnxruntime-node — ~210 MB of multi-platform
// native binaries — which Nitro's file tracer would otherwise copy into the
// Vercel serverless function, blowing the 250 MB limit. The server never runs
// this code, so resolve the package to a tiny stub for every non-client build:
// the bundle holds no reference to it, the tracer skips onnxruntime-node, and
// the client build still gets the real package as an on-demand chunk.
function stubTransformersOnServer(): Plugin {
	const ID = "@huggingface/transformers";
	const STUB = "\0transformers-server-stub";
	return {
		name: "stub-transformers-on-server",
		enforce: "pre",
		resolveId(id, _importer, options) {
			if (id === STUB) return STUB;
			if (id !== ID) return;
			const envName = this.environment?.name;
			const isServer =
				options?.ssr === true ||
				(envName !== undefined && envName !== "client");
			return isServer ? STUB : undefined;
		},
		load(id) {
			if (id !== STUB) return;
			return [
				"export const pipeline = () => {",
				'  throw new Error("transformers.js is browser-only and must not run on the server")',
				"}",
				"export const env = {}",
				"export default {}",
			].join("\n");
		},
	};
}

const config = defineConfig({
	plugins: [
		stubTransformersOnServer(),
		devtools(),
		nitro(),
		// this is the plugin that enables path aliases
		viteTsConfigPaths({
			projects: ["./tsconfig.json"],
		}),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	],
	optimizeDeps: {
		// Browser-only, lazy-loaded on demand — keep it out of the dev prebundle.
		exclude: ["@huggingface/transformers"],
	},
});

export default config;
