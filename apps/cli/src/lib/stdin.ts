export interface HookStdinInput {
	session_id: string;
	transcript_path: string;
	cwd: string;
	permission_mode: string;
	hook_event_name: string;
	stop_hook_active: boolean;
}

/**
 * Read stdin using platform-specific approach.
 * Returns empty string if stdin is a TTY or unavailable.
 */
export async function readStdin(): Promise<string> {
	if (process.stdin.isTTY) {
		return "";
	}

	if (process.platform === "win32") {
		const chunks: Buffer[] = [];
		for await (const chunk of process.stdin) {
			chunks.push(Buffer.from(chunk));
		}
		return Buffer.concat(chunks).toString("utf8");
	}

	const chunks: Uint8Array[] = [];
	try {
		for await (const chunk of Bun.stdin.stream()) {
			chunks.push(chunk);
		}
	} catch (error: unknown) {
		const code = (error as { code?: string }).code;
		if (code === "EBADF" || code === "ENXIO") {
			return "";
		}
		throw error;
	}
	return Buffer.concat(chunks).toString("utf8");
}

export function parseStdinInput(input: string): HookStdinInput | null {
	if (!input.trim()) {
		return null;
	}
	try {
		return JSON.parse(input) as HookStdinInput;
	} catch {
		return null;
	}
}
