import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const CONFIG_DIR = join(homedir(), ".config", "gazed");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export interface GazedConfig {
	apiKey?: string;
	endpoint?: string;
}

export async function readConfig(): Promise<GazedConfig> {
	try {
		const content = await readFile(CONFIG_FILE, "utf8");
		return JSON.parse(content) as GazedConfig;
	} catch {
		return {};
	}
}

export async function writeConfig(config: GazedConfig): Promise<void> {
	await mkdir(dirname(CONFIG_FILE), { recursive: true });
	await writeFile(CONFIG_FILE, JSON.stringify(config, null, "\t"), "utf8");
}
