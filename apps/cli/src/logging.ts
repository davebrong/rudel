import { homedir } from "node:os";
import { join } from "node:path";
import { getFileSink } from "@logtape/file";
import { configure, dispose } from "@logtape/logtape";

const LOG_DIR = join(homedir(), ".rudel", "logs");
const LOG_FILE = join(LOG_DIR, "hook-upload.log");

export async function setupHookLogging(): Promise<void> {
	const { mkdir } = await import("node:fs/promises");
	await mkdir(LOG_DIR, { recursive: true }).catch(() => {});

	await configure({
		sinks: {
			file: getFileSink(LOG_FILE),
		},
		loggers: [
			{
				category: ["rudel", "cli"],
				lowestLevel: "debug",
				sinks: ["file"],
			},
		],
	});
}

export { dispose as disposeLogging };
