import { buildRouteMap } from "@stricli/core";
import { claudeRouteMap } from "./claude/index.js";
import { codexRouteMap } from "./codex/index.js";

export const hooksRouteMap = buildRouteMap({
	routes: {
		claude: claudeRouteMap,
		codex: codexRouteMap,
	},
	docs: {
		brief: "Hook handlers",
	},
});
