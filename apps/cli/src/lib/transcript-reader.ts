/**
 * Read a transcript file content with retry for timing issues.
 */
export async function readTranscript(transcriptPath: string): Promise<string> {
	const maxRetries = 5;
	const delayMs = 500;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			const file = Bun.file(transcriptPath);
			if (!(await file.exists())) {
				if (attempt < maxRetries) {
					await new Promise((resolve) => setTimeout(resolve, delayMs));
					continue;
				}
				throw new Error(
					`Transcript file not found after ${maxRetries} attempts: ${transcriptPath}`,
				);
			}
			return await file.text();
		} catch (error) {
			if (attempt < maxRetries) {
				await new Promise((resolve) => setTimeout(resolve, delayMs));
				continue;
			}
			throw error;
		}
	}

	throw new Error(`Failed to read transcript: ${transcriptPath}`);
}

/**
 * Extract agent IDs referenced in a session transcript.
 * Agents are spawned via the Task tool and their IDs are recorded in toolUseResult.agentId
 */
export function extractAgentIds(sessionContent: string): string[] {
	const agentIds = new Set<string>();

	for (const line of sessionContent.split("\n")) {
		if (!line.trim()) continue;

		try {
			const entry = JSON.parse(line);
			if (entry.toolUseResult?.agentId) {
				agentIds.add(entry.toolUseResult.agentId);
			}
		} catch {
			// Skip malformed lines
		}
	}

	return Array.from(agentIds);
}
