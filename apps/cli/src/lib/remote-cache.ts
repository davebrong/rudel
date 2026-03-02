import { homedir } from "node:os";
import { join } from "node:path";

const CACHE_PATH = join(homedir(), ".rudel", "remote-cache.json");

type RemoteCacheData = Record<string, string>;

export async function getRemoteCache(): Promise<RemoteCacheData> {
	try {
		const file = Bun.file(CACHE_PATH);
		if (!(await file.exists())) return {};
		return (await file.json()) as RemoteCacheData;
	} catch {
		return {};
	}
}

export function getCachedRemote(
	cache: RemoteCacheData,
	encodedDir: string,
): string | null {
	return cache[encodedDir] ?? null;
}

export function cacheRemote(
	cache: RemoteCacheData,
	encodedDir: string,
	normalizedRemote: string,
): void {
	cache[encodedDir] = normalizedRemote;
}

export async function cacheRemotes(cache: RemoteCacheData): Promise<void> {
	try {
		const { mkdir } = await import("node:fs/promises");
		const { dirname } = await import("node:path");
		await mkdir(dirname(CACHE_PATH), { recursive: true });
		await Bun.write(CACHE_PATH, JSON.stringify(cache));
	} catch {
		// Fire-and-forget — cache is best-effort
	}
}
