import { buildApplication, buildRouteMap } from "@stricli/core";
import { loginCommand } from "./commands/login.js";
import { logoutCommand } from "./commands/logout.js";
import { uploadCommand } from "./commands/upload.js";
import { whoamiCommand } from "./commands/whoami.js";

const routes = buildRouteMap({
	routes: {
		login: loginCommand,
		logout: logoutCommand,
		whoami: whoamiCommand,
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
