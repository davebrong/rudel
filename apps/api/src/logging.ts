import {
	configure,
	getConsoleSink,
	jsonLinesFormatter,
} from "@logtape/logtape";

const isProduction = !!process.env.FLY_APP_NAME;

export async function setupLogging(): Promise<void> {
	await configure({
		sinks: {
			console: getConsoleSink({
				formatter: isProduction ? jsonLinesFormatter : undefined,
			}),
		},
		loggers: [
			{
				category: ["rudel", "api"],
				lowestLevel: isProduction ? "info" : "debug",
				sinks: ["console"],
			},
			{
				category: ["logtape", "meta"],
				lowestLevel: "warning",
				sinks: ["console"],
			},
		],
	});
}
