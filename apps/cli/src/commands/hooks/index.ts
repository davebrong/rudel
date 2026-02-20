import { buildRouteMap } from "@stricli/core";
import { claudeRouteMap } from "./claude/index.js";

export const hooksRouteMap = buildRouteMap({
	routes: {
		claude: claudeRouteMap,
	},
	docs: {
		brief: "Hook handlers",
	},
});
