#!/usr/bin/env bun
/**
 * Release script for the `rudel` CLI package.
 *
 * Handles the full release lifecycle:
 *   1. Prerequisite checks (tools, branch, npm auth)
 *   2. Bumps the version (patch or minor)
 *   3. Runs quality gates (typecheck, lint, test, build)
 *   4. Publishes via `bun publish`
 *   5. Commits version changes, tags, and pushes
 *
 * Usage: bun run ./scripts/release-cli.ts [patch|minor] [--dry-run]
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process, { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";

type ReleaseArgs = {
	bump: "patch" | "minor";
	dryRun: boolean;
};

type CommandResult = {
	stdout: string;
	stderr: string;
};

type PackageJson = {
	name: string;
	version: string;
};

const CLI_DIR = resolve("apps/cli");
const CLI_PKG_PATH = resolve(CLI_DIR, "package.json");
const APP_TS_PATH = resolve(CLI_DIR, "src/app.ts");

export async function main(): Promise<void> {
	const args = parseArgs(process.argv.slice(2));

	// 1. Prerequisites
	logLine("Checking prerequisites...");
	ensureRequiredTools();
	ensureOnMainBranch();
	ensureCleanWorkingTree();
	ensureNpmAuth();

	// 2. Version bump
	const pkg = readCliPackageJson();
	const currentVersion = pkg.version;
	const nextVersion = bumpVersion(currentVersion, args.bump);

	logLine(`Version: ${currentVersion} -> ${nextVersion} (${args.bump})`);

	if (args.dryRun) {
		logLine("Dry-run: would update version and publish. Stopping here.");
		return;
	}

	writeCliVersion(nextVersion);

	// 3. Quality gates
	runQualityGates();

	// 4. Publish
	const otp = await promptForOtp();
	publishCli(otp);

	// 5. Commit, tag, push
	commitTagAndPush(nextVersion);

	logLine(`Released rudel@${nextVersion}`);
}

// ---------------------------------------------------------------------------
// Version management
// ---------------------------------------------------------------------------

function readCliPackageJson(): PackageJson {
	return JSON.parse(readFileSync(CLI_PKG_PATH, "utf8")) as PackageJson;
}

function bumpVersion(current: string, bump: "patch" | "minor"): string {
	const parts = current.split(".").map(Number);
	if (parts.length !== 3 || parts.some(Number.isNaN)) {
		fail(`Invalid version format: ${current}`);
	}
	const [major, minor, patch] = parts;

	if (bump === "minor") {
		return `${major}.${minor + 1}.0`;
	}
	return `${major}.${minor}.${patch + 1}`;
}

function writeCliVersion(version: string): void {
	// Update package.json
	const pkg = JSON.parse(readFileSync(CLI_PKG_PATH, "utf8"));
	pkg.version = version;
	writeFileSync(CLI_PKG_PATH, `${JSON.stringify(pkg, null, "\t")}\n`);

	// Update hardcoded version in app.ts
	const appTs = readFileSync(APP_TS_PATH, "utf8");
	const updated = appTs.replace(
		/currentVersion:\s*"[^"]+"/,
		`currentVersion: "${version}"`,
	);
	if (updated === appTs) {
		fail("Could not find currentVersion in app.ts to update");
	}
	writeFileSync(APP_TS_PATH, updated);

	logLine(`Updated version to ${version} in package.json and app.ts`);
}

// ---------------------------------------------------------------------------
// Publishing
// ---------------------------------------------------------------------------

function publishCli(otp: string): void {
	const pkg = readCliPackageJson();

	if (isVersionPublished(pkg.name, pkg.version)) {
		fail(`${pkg.name}@${pkg.version} is already published on npm.`);
	}

	logLine(`Publishing ${pkg.name}@${pkg.version}...`);
	runCommand("bun", ["publish", "--access", "public", "--otp", otp], {
		cwd: CLI_DIR,
	});
}

function isVersionPublished(name: string, version: string): boolean {
	const result = spawnSync("npm", ["view", `${name}@${version}`, "version"], {
		encoding: "utf8",
		env: process.env,
	});
	return result.status === 0 && result.stdout.trim() === version;
}

// ---------------------------------------------------------------------------
// Git
// ---------------------------------------------------------------------------

function commitTagAndPush(version: string): void {
	const tag = `rudel@${version}`;

	logLine("Committing version changes...");
	runCommand("git", ["add", CLI_PKG_PATH, APP_TS_PATH]);
	runCommand("git", ["commit", "-m", `chore: release rudel@${version}`]);
	runCommand("git", ["tag", tag]);
	runCommand("git", ["push", "origin", "main"]);
	runCommand("git", ["push", "origin", tag]);

	logLine(`Tagged ${tag} and pushed to origin/main`);
}

// ---------------------------------------------------------------------------
// Preconditions
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): ReleaseArgs {
	let bump: "patch" | "minor" = "patch";
	let dryRun = false;

	for (const arg of argv) {
		if (arg === "patch" || arg === "minor") {
			bump = arg;
			continue;
		}
		if (arg === "--dry-run") {
			dryRun = true;
			continue;
		}
		fail(`Unknown argument: ${arg}. Usage: release-cli.ts [patch|minor] [--dry-run]`);
	}

	return { bump, dryRun };
}

function ensureRequiredTools(): void {
	runCommand("bun", ["--version"]);
	runCommand("git", ["--version"]);
	runCommand("npm", ["--version"]);
}

function ensureOnMainBranch(): void {
	const result = runCommand("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
	const branch = result.stdout.trim();
	if (branch !== "main") {
		fail(`Release must run on main. Current branch: ${branch}`);
	}
}

function ensureCleanWorkingTree(): void {
	const result = runCommand("git", ["status", "--porcelain"]);
	if (result.stdout.trim().length > 0) {
		fail("Working tree is not clean. Commit or stash changes first.");
	}
}

function ensureNpmAuth(): void {
	runCommand("npm", ["whoami"]);
}

function runQualityGates(): void {
	logLine("Running quality gates (lint, typecheck, test, build)...");
	runCommand("bun", ["run", "verify"]);
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

async function promptForOtp(): Promise<string> {
	const rl = createInterface({ input: stdin, output: stdout });
	try {
		const otp = await rl.question("Enter npm OTP to publish: ");
		const trimmed = otp.trim();
		if (trimmed.length === 0) {
			fail("No OTP provided. Publish cancelled.");
		}
		return trimmed;
	} finally {
		rl.close();
	}
}

function runCommand(
	command: string,
	args: string[],
	options?: { cwd?: string },
): CommandResult {
	const rendered = `${command} ${args.map(shellQuote).join(" ")}`;
	logLine(`$ ${rendered}`);

	const result = spawnSync(command, args, {
		cwd: options?.cwd ?? process.cwd(),
		encoding: "utf8",
		env: process.env,
	});

	const stdoutText = result.stdout ?? "";
	const stderrText = result.stderr ?? "";

	if (stdoutText.length > 0) {
		process.stdout.write(stdoutText);
	}
	if (stderrText.length > 0) {
		process.stderr.write(stderrText);
	}

	if (result.status !== 0) {
		fail(`Command failed (${result.status}): ${rendered}`);
	}

	return { stdout: stdoutText, stderr: stderrText };
}

function shellQuote(value: string): string {
	if (/^[A-Za-z0-9_./:-]+$/.test(value)) {
		return value;
	}
	return `'${value.replaceAll("'", "'\\''")}'`;
}

function logLine(message: string): void {
	process.stdout.write(`${message}\n`);
}

function fail(message: string): never {
	logLine(`ERROR: ${message}`);
	process.exit(1);
}

await main();
