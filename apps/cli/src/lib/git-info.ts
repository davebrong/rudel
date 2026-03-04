import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { exec } from "./exec.js";

export interface GitInfo {
	repository?: string;
	gitRemote?: string;
	packageName?: string;
	branch?: string;
	sha?: string;
}

/**
 * Normalize a git remote URL to a canonical form: "github.com/owner/repo"
 */
export function normalizeRemoteUrl(url: string): string {
	return url
		.replace(/^(https?:\/\/|git@|ssh:\/\/)/, "")
		.replace(/:/, "/")
		.replace(/\.git$/, "");
}

/**
 * Extract git metadata for a given project directory.
 */
export async function getGitInfo(cwd: string): Promise<GitInfo> {
	const [remoteUrl, branch, sha, packageName] = await Promise.all([
		getGitRemoteUrl(cwd),
		getGitBranch(cwd),
		getGitSha(cwd),
		getPackageName(cwd),
	]);

	const gitRemote = remoteUrl ? normalizeRemoteUrl(remoteUrl) : undefined;
	const repository = getRepositoryName(gitRemote, packageName, cwd);

	return {
		repository,
		gitRemote,
		packageName: packageName ?? undefined,
		branch: branch ?? undefined,
		sha: sha ?? undefined,
	};
}

/**
 * Extract a display name for the repository.
 * Prefers owner/repo from git remote, falls back to package name, then dir name.
 */
function getRepositoryName(
	gitRemote: string | undefined,
	packageName: string | null,
	cwd: string,
): string | undefined {
	if (gitRemote) {
		// "github.com/owner/repo" → "owner/repo"
		const parts = gitRemote.split("/");
		if (parts.length >= 3) {
			return parts.slice(1).join("/");
		}
		return gitRemote;
	}
	if (packageName) return packageName;
	const dirName = cwd.split("/").pop();
	return dirName ?? undefined;
}

async function getPackageName(cwd: string): Promise<string | null> {
	try {
		const result = await exec("git", [
			"-C",
			cwd,
			"rev-parse",
			"--show-toplevel",
		]);
		const gitRoot = result.exitCode === 0 ? result.stdout.trim() : cwd;

		const packageJsonPath = join(gitRoot, "package.json");
		if (existsSync(packageJsonPath)) {
			try {
				const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
				if (packageJson.name) return packageJson.name;
			} catch {
				// Invalid JSON
			}
		}
		return null;
	} catch {
		return null;
	}
}

export async function getGitRemoteUrl(cwd: string): Promise<string | null> {
	try {
		const result = await exec("git", [
			"-C",
			cwd,
			"remote",
			"get-url",
			"origin",
		]);
		if (result.exitCode !== 0) return null;
		return result.stdout.trim() || null;
	} catch {
		return null;
	}
}

async function getGitBranch(cwd: string): Promise<string | null> {
	try {
		const result = await exec("git", [
			"-C",
			cwd,
			"rev-parse",
			"--abbrev-ref",
			"HEAD",
		]);
		if (result.exitCode !== 0) return null;
		return result.stdout.trim();
	} catch {
		return null;
	}
}

async function getGitSha(cwd: string): Promise<string | null> {
	try {
		const result = await exec("git", ["-C", cwd, "rev-parse", "HEAD"]);
		if (result.exitCode !== 0) return null;
		return result.stdout.trim();
	} catch {
		return null;
	}
}
