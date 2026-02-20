import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const HOOK_COMMAND = "rudel hooks claude session-end";

function findGitRoot(): string {
	return execSync("git rev-parse --show-toplevel", {
		encoding: "utf-8",
	}).trim();
}

interface HookEntry {
	type: string;
	command: string;
	async?: boolean;
}

interface HookMatcher {
	matcher: string;
	hooks: HookEntry[];
}

interface ClaudeSettings {
	hooks?: {
		SessionEnd?: HookMatcher[];
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

export function getClaudeSettingsPath(): string {
	const root = findGitRoot();
	return join(root, ".claude", "settings.json");
}

export function readClaudeSettings(): ClaudeSettings {
	const path = getClaudeSettingsPath();
	if (!existsSync(path)) return {};
	const content = readFileSync(path, "utf-8");
	return JSON.parse(content) as ClaudeSettings;
}

export function writeClaudeSettings(settings: ClaudeSettings): void {
	const path = getClaudeSettingsPath();
	const dir = join(path, "..");
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
	writeFileSync(path, `${JSON.stringify(settings, null, 2)}\n`);
}

export function isHookEnabled(): boolean {
	const settings = readClaudeSettings();
	const entries = settings.hooks?.SessionEnd;
	if (!Array.isArray(entries)) return false;
	return entries.some((entry) =>
		entry.hooks?.some((h) => h.command === HOOK_COMMAND),
	);
}

export function addHook(): void {
	const settings = readClaudeSettings();
	if (!settings.hooks) {
		settings.hooks = {};
	}
	if (!Array.isArray(settings.hooks.SessionEnd)) {
		settings.hooks.SessionEnd = [];
	}

	const alreadyExists = settings.hooks.SessionEnd.some((entry) =>
		entry.hooks?.some((h) => h.command === HOOK_COMMAND),
	);
	if (alreadyExists) return;

	settings.hooks.SessionEnd.push({
		matcher: "",
		hooks: [{ type: "command", command: HOOK_COMMAND, async: true }],
	});

	writeClaudeSettings(settings);
}

export function removeHook(): void {
	const settings = readClaudeSettings();
	const hooks = settings.hooks;
	const entries = hooks?.SessionEnd;
	if (!hooks || !Array.isArray(entries)) return;

	hooks.SessionEnd = entries.filter(
		(entry) => !entry.hooks?.some((h) => h.command === HOOK_COMMAND),
	);

	if (hooks.SessionEnd.length === 0) {
		delete hooks.SessionEnd;
	}
	if (Object.keys(hooks).length === 0) {
		delete settings.hooks;
	}

	writeClaudeSettings(settings);
}
