import { join } from "node:path";
import { $ } from "bun";

export interface GitInfo {
	repository?: string;
	gitRemote?: string;
	packageName?: string;
	packageType?: string;
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
		packageType: packageName ? "package.json" : undefined,
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
		const gitRootResult =
			await $`git -C ${cwd} rev-parse --show-toplevel`.quiet();
		const gitRoot =
			gitRootResult.exitCode === 0 ? gitRootResult.text().trim() : cwd;

		const packageJsonPath = join(gitRoot, "package.json");
		const packageFile = Bun.file(packageJsonPath);
		if (await packageFile.exists()) {
			try {
				const packageJson = await packageFile.json();
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
		const result = await $`git -C ${cwd} remote get-url origin`.quiet();
		if (result.exitCode !== 0) return null;
		return result.text().trim() || null;
	} catch {
		return null;
	}
}

async function getGitBranch(cwd: string): Promise<string | null> {
	try {
		const result = await $`git -C ${cwd} rev-parse --abbrev-ref HEAD`.quiet();
		if (result.exitCode !== 0) return null;
		return result.text().trim();
	} catch {
		return null;
	}
}

async function getGitSha(cwd: string): Promise<string | null> {
	try {
		const result = await $`git -C ${cwd} rev-parse HEAD`.quiet();
		if (result.exitCode !== 0) return null;
		return result.text().trim();
	} catch {
		return null;
	}
}
