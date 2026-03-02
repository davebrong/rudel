import { buildRouteMap } from "@stricli/core";
import { turnCompleteCommand } from "./turn-complete.js";

export const codexRouteMap = buildRouteMap({
	routes: {
		"turn-complete": turnCompleteCommand,
	},
	docs: {
		brief: "Codex hook handlers",
	},
});
