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
	const [remoteUrl, branch, sha, packageInfo] = await Promise.all([
		getGitRemoteUrl(cwd),
		getGitBranch(cwd),
		getGitSha(cwd),
		getPackageInfo(cwd),
	]);

	const gitRemote = remoteUrl ? normalizeRemoteUrl(remoteUrl) : undefined;
	const repository = getRepositoryName(
		gitRemote,
		packageInfo?.name ?? null,
		cwd,
	);

	return {
		repository,
		gitRemote,
		packageName: packageInfo?.name,
		packageType: packageInfo?.type,
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

interface PackageInfo {
	name: string;
	type: string;
}

async function getPackageInfo(cwd: string): Promise<PackageInfo | null> {
	try {
		const gitRootResult =
			await $`git -C ${cwd} rev-parse --show-toplevel`.quiet();
		const root =
			gitRootResult.exitCode === 0 ? gitRootResult.text().trim() : cwd;

		return (
			(await getNodePackage(root)) ??
			(await getPythonPackage(root)) ??
			(await getRustPackage(root)) ??
			(await getGoModule(root))
		);
	} catch {
		return null;
	}
}

async function getNodePackage(root: string): Promise<PackageInfo | null> {
	try {
		const file = Bun.file(join(root, "package.json"));
		if (!(await file.exists())) return null;
		const pkg = await file.json();
		return pkg.name ? { name: pkg.name, type: "package.json" } : null;
	} catch {
		return null;
	}
}

async function getPythonPackage(root: string): Promise<PackageInfo | null> {
	try {
		const file = Bun.file(join(root, "pyproject.toml"));
		if (!(await file.exists())) return null;
		const content = await file.text();
		const name = content.match(/^\s*name\s*=\s*"([^"]+)"/m)?.[1];
		return name ? { name, type: "pyproject.toml" } : null;
	} catch {
		return null;
	}
}

async function getRustPackage(root: string): Promise<PackageInfo | null> {
	try {
		const file = Bun.file(join(root, "Cargo.toml"));
		if (!(await file.exists())) return null;
		const content = await file.text();
		const name = content.match(/^\s*name\s*=\s*"([^"]+)"/m)?.[1];
		return name ? { name, type: "Cargo.toml" } : null;
	} catch {
		return null;
	}
}

async function getGoModule(root: string): Promise<PackageInfo | null> {
	try {
		const file = Bun.file(join(root, "go.mod"));
		if (!(await file.exists())) return null;
		const content = await file.text();
		const name = content.match(/^module\s+(\S+)/m)?.[1];
		return name ? { name, type: "go.mod" } : null;
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
