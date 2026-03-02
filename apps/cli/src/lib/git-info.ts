import { join } from "node:path";
import { $ } from "bun";

export interface GitInfo {
	repository?: string;
	branch?: string;
	sha?: string;
}

/**
 * Extract git metadata for a given project directory.
 */
export async function getGitInfo(cwd: string): Promise<GitInfo> {
	const [repository, branch, sha] = await Promise.all([
		getRepositoryName(cwd),
		getGitBranch(cwd),
		getGitSha(cwd),
	]);

	return {
		repository: repository ?? undefined,
		branch: branch ?? undefined,
		sha: sha ?? undefined,
	};
}

async function getRepositoryName(cwd: string): Promise<string | null> {
	try {
		const gitRootResult =
			await $`git -C ${cwd} rev-parse --show-toplevel`.quiet();
		if (gitRootResult.exitCode !== 0) return null;

		const gitRoot = gitRootResult.text().trim();

		// Try package.json name first
		const packageJsonPath = join(gitRoot, "package.json");
		const packageFile = Bun.file(packageJsonPath);
		if (await packageFile.exists()) {
			try {
				const packageJson = await packageFile.json();
				if (packageJson.name) return packageJson.name;
			} catch {
				// Invalid JSON, continue to git remote
			}
		}

		// Fall back to git remote origin URL
		const remoteResult =
			await $`git -C ${gitRoot} remote get-url origin`.quiet();
		if (remoteResult.exitCode === 0) {
			const remoteUrl = remoteResult.text().trim();
			const match = remoteUrl.match(/[/:]([^/]+?)(?:\.git)?$/);
			if (match?.[1]) return match[1];
		}

		// Fall back to directory name
		const dirName = gitRoot.split("/").pop();
		return dirName ?? null;
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
