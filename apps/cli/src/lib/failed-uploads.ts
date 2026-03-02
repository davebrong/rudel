import { homedir } from "node:os";
import { join } from "node:path";

const FAILED_UPLOADS_PATH = join(homedir(), ".rudel", "failed-uploads.json");

export interface FailedUpload {
	sessionId: string;
	transcriptPath: string;
	projectPath: string;
	/** Agent adapter source (e.g. "claude-code", "codex") */
	source?: string;
	organizationId?: string;
	error: string;
	failedAt: string;
}

interface FailedUploadsData {
	failures: FailedUpload[];
}

export async function loadFailedUploads(): Promise<FailedUpload[]> {
	try {
		const file = Bun.file(FAILED_UPLOADS_PATH);
		if (!(await file.exists())) return [];
		const data = (await file.json()) as FailedUploadsData;
		return data.failures;
	} catch {
		return [];
	}
}

async function saveFailedUploads(failures: FailedUpload[]): Promise<void> {
	try {
		const { mkdir } = await import("node:fs/promises");
		const { dirname } = await import("node:path");
		await mkdir(dirname(FAILED_UPLOADS_PATH), { recursive: true });
		const data: FailedUploadsData = { failures };
		await Bun.write(FAILED_UPLOADS_PATH, JSON.stringify(data, null, 2));
	} catch {
		// Best-effort — don't break the upload flow
	}
}

export async function recordFailedUpload(
	failure: Omit<FailedUpload, "failedAt">,
): Promise<void> {
	const failures = await loadFailedUploads();
	const existing = failures.findIndex((f) => f.sessionId === failure.sessionId);
	const entry: FailedUpload = {
		...failure,
		failedAt: new Date().toISOString(),
	};
	if (existing >= 0) {
		failures[existing] = entry;
	} else {
		failures.push(entry);
	}
	await saveFailedUploads(failures);
}

export async function removeFailedUpload(sessionId: string): Promise<void> {
	const failures = await loadFailedUploads();
	const filtered = failures.filter((f) => f.sessionId !== sessionId);
	if (filtered.length !== failures.length) {
		await saveFailedUploads(filtered);
	}
}
