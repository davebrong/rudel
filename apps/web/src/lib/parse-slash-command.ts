/**
 * Parse slash command XML tags from user messages
 */

export interface SlashCommandInfo {
	commandMessage: string;
	commandName: string;
	commandArgs: string;
}

/**
 * Check if a user message contains slash command tags
 */
export function isSlashCommandMessage(content: string): boolean {
	return (
		content.includes("<command-message>") ||
		content.includes("<command-name>") ||
		content.includes("<command-args>")
	);
}

/**
 * Extract slash command information from message content
 */
export function parseSlashCommand(content: string): SlashCommandInfo | null {
	const commandMessageMatch = content.match(
		/<command-message>([\s\S]*?)<\/command-message>/,
	);
	const commandNameMatch = content.match(
		/<command-name>([\s\S]*?)<\/command-name>/,
	);
	const commandArgsMatch = content.match(
		/<command-args>([\s\S]*?)<\/command-args>/,
	);

	if (!commandMessageMatch && !commandNameMatch) {
		return null;
	}

	return {
		commandMessage: commandMessageMatch?.[1]?.trim() || "",
		commandName: commandNameMatch?.[1]?.trim() || "",
		commandArgs: commandArgsMatch?.[1]?.trim() || "",
	};
}
