import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const runtimeDir = join(rootDir, "apps", "api", "src");

const runtimePatterns = [
	{
		description: "escapeString() usage is forbidden",
		regex: /\bescapeString\s*\(/gm,
	},
	{
		description: "queryClickhouse() must receive a statement object, not a raw SQL string",
		regex: /\bqueryClickhouse(?:<[\s\S]*?>)?\(\s*[`'"]/gm,
	},
	{
		description: "ClickHouse query()/execute() must receive a statement object, not a raw SQL string",
		regex: /\.(?:query|execute)(?:<[\s\S]*?>)?\(\s*[`'"]/gm,
	},
	{
		description:
			"qualified ClickHouse table names must come from the internal allowlist, not {table:Identifier} params",
		regex: /\{table:Identifier\}/gm,
	},
];

const sessionAnalyticsPatterns = [
	{
		description: "dimension analysis must not fall back to raw dimension identifiers",
		regex: /\|\|\s*dimension\b/gm,
	},
	{
		description: "dimension analysis must not fall back to raw split identifiers",
		regex: /\|\|\s*split_by\b/gm,
	},
];

async function collectTsFiles(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true });
	const files: string[] = [];

	for (const entry of entries) {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === "__tests__") continue;
			files.push(...(await collectTsFiles(fullPath)));
			continue;
		}
		if (entry.isFile() && entry.name.endsWith(".ts")) {
			files.push(fullPath);
		}
	}

	return files;
}

function getLineNumber(source: string, index: number): number {
	return source.slice(0, index).split("\n").length;
}

async function main(): Promise<void> {
	const files = await collectTsFiles(runtimeDir);
	const violations: string[] = [];

	for (const file of files) {
		const source = await readFile(file, "utf8");
		const relPath = relative(rootDir, file);
		const isClickHouseRuntimeFile =
			source.includes("queryClickhouse") ||
			source.includes("getClickhouse") ||
			source.includes("clickhouse.js");

		if (isClickHouseRuntimeFile) {
			for (const pattern of runtimePatterns) {
				for (const match of source.matchAll(pattern.regex)) {
					const line = getLineNumber(source, match.index ?? 0);
					violations.push(
						`${relPath}:${line} ${pattern.description}`,
					);
				}
			}
		}

		if (relPath === "apps/api/src/services/session-analytics.service.ts") {
			for (const pattern of sessionAnalyticsPatterns) {
				for (const match of source.matchAll(pattern.regex)) {
					const line = getLineNumber(source, match.index ?? 0);
					violations.push(
						`${relPath}:${line} ${pattern.description}`,
					);
				}
			}
		}
	}

	if (violations.length > 0) {
		console.error("ClickHouse guardrail violations found:");
		for (const violation of violations) {
			console.error(`- ${violation}`);
		}
		process.exit(1);
	}

	console.log("ClickHouse guardrails passed.");
}

await main();
