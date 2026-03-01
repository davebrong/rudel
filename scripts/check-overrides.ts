import { readFileSync } from "node:fs";
import { join } from "node:path";

const rootPkg = JSON.parse(
	readFileSync(join(import.meta.dirname, "..", "package.json"), "utf-8"),
);

const overrides: Record<string, string> = rootPkg.overrides || {};
const localOverrides = Object.entries(overrides).filter(([, v]) =>
	v.startsWith("file:"),
);

if (localOverrides.length > 0) {
	console.error("ERROR: Local file: overrides detected in package.json:");
	for (const [pkg, val] of localOverrides) {
		console.error(`  ${pkg}: ${val}`);
	}
	console.error("\nRun `bun run chkit:unlink` before committing.");
	process.exit(1);
}
