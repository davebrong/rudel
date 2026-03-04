import { mkdir, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { exec } from "./exec.js";
import { SESSION_TAGS, type SessionTag } from "./types.js";

const SYSTEM_PROMPT = `You are a session classifier. Analyze the Claude Code session transcript and classify it into exactly ONE of these categories:

- research: Exploring codebase, understanding code, answering questions about how things work
- new_feature: Implementing new functionality or features
- bug_fix: Fixing bugs, errors, or unexpected behavior
- refactoring: Restructuring existing code without changing functionality
- documentation: Writing or updating documentation, comments, READMEs
- tests: Writing, updating, or fixing tests

CRITICAL: Respond with ONLY the tag name. Nothing else. No explanation, no punctuation, no formatting. Just ONE of: research, new_feature, bug_fix, refactoring, documentation, tests`;

/**
 * Classify a session transcript using Claude CLI.
 * Returns one of the predefined tags based on the session content.
 */
export async function classifySession(
	content: string,
): Promise<SessionTag | undefined> {
	// Truncate content to avoid excessive API costs
	const truncatedContent = content.slice(0, 50000);

	const tempDir = join(homedir(), ".claude", "temp");
	const tempFile = join(tempDir, `classify-${Date.now()}.txt`);

	try {
		await mkdir(tempDir, { recursive: true });
		await writeFile(
			tempFile,
			`Classify this session transcript:\n\n${truncatedContent}`,
		);

		const prompt = `Read and classify the session transcript in this file: ${tempFile}`;
		const escapedPrompt = prompt.replace(/'/g, "'\\''");
		const escapedSystemPrompt = SYSTEM_PROMPT.replace(/'/g, "'\\''");

		const result = await exec("sh", [
			"-c",
			`echo '${escapedPrompt}' | claude --output-format text --print --model haiku --no-session-persistence --dangerously-skip-permissions --system-prompt '${escapedSystemPrompt}'`,
		]);

		if (result.exitCode !== 0) {
			return "other";
		}

		const output = result.stdout.trim().toLowerCase();

		// Exact match
		if (SESSION_TAGS.includes(output as SessionTag)) {
			return output as SessionTag;
		}

		// Search for valid tags in verbose output
		for (const tag of SESSION_TAGS) {
			if (new RegExp(`\\b${tag}\\b`).test(output)) {
				return tag;
			}
		}

		return "other";
	} catch {
		return undefined;
	} finally {
		try {
			await unlink(tempFile);
		} catch {
			// Ignore cleanup errors
		}
	}
}
