import { appendFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const LOG_FILE = join(homedir(), ".claude", "logs", "gazed-session-upload.log");

export async function log(level: string, message: string): Promise<void> {
	const line = `${new Date().toISOString()} [${level}] ${message}\n`;
	await mkdir(dirname(LOG_FILE), { recursive: true }).catch(() => {});
	await appendFile(LOG_FILE, line).catch(() => {});
}
