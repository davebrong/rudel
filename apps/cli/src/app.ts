import { buildApplication, buildRouteMap } from "@stricli/core";
import { disableCommand } from "./commands/disable.js";
import { enableCommand } from "./commands/enable.js";
import { hooksRouteMap } from "./commands/hooks/index.js";
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
		enable: enableCommand,
		disable: disableCommand,
		hooks: hooksRouteMap,
	},
	docs: {
		brief: "CLI tools for managing Claude Code sessions",
		hideRoute: { hooks: true },
	},
});

export const app = buildApplication(routes, {
	name: "rudel",
	versionInfo: {
		currentVersion: "0.1.1",
	},
	scanner: {
		caseStyle: "allow-kebab-for-camel",
	},
});
