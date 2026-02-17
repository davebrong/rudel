import { buildApplication, buildRouteMap } from "@stricli/core";
import { uploadCommand } from "./commands/upload.js";

const routes = buildRouteMap({
	routes: {
		upload: uploadCommand,
	},
	docs: {
		brief: "CLI tools for managing Claude Code sessions",
	},
});

export const app = buildApplication(routes, {
	name: "rudel",
	versionInfo: {
		currentVersion: "0.0.0",
	},
	scanner: {
		caseStyle: "allow-kebab-for-camel",
	},
});
