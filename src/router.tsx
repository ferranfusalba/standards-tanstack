import { createRouter } from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
export const getRouter = () => {
	const router = createRouter({
		routeTree,
		context: {},

		scrollRestoration: true,
		defaultPreloadStaleTime: 30_000,
		defaultStaleTime: 5 * 60_000,

		defaultPendingComponent: () => (
			<div className="min-h-screen flex items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin" />
					<p className="text-muted-foreground text-sm">Loading...</p>
				</div>
			</div>
		),

		defaultErrorComponent: ({ error }) => (
			<div className="min-h-screen flex items-center justify-center p-6">
				<div className="text-center max-w-md">
					<h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
					<p className="text-muted-foreground mb-6">
						{error instanceof Error
							? error.message
							: "An unexpected error occurred."}
					</p>
					<a
						href="/"
						className="text-cyan-600 dark:text-cyan-400 hover:underline"
					>
						Go back home
					</a>
				</div>
			</div>
		),
	});

	return router;
};
