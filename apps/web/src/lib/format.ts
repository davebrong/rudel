const INPUT_PRICE_PER_MILLION = 3;
const OUTPUT_PRICE_PER_MILLION = 15;

export function calculateCost(
	inputTokens: number,
	outputTokens: number,
): number {
	return (
		(inputTokens / 1_000_000) * INPUT_PRICE_PER_MILLION +
		(outputTokens / 1_000_000) * OUTPUT_PRICE_PER_MILLION
	);
}

export function formatUsername(
	userId: string,
	userMap?: Record<string, string>,
): string {
	if (userMap?.[userId]) {
		return userMap[userId];
	}
	return userId;
}

export function encodeProjectPath(path: string): string {
	return encodeURIComponent(path);
}

export function decodeProjectPath(encoded: string): string {
	return decodeURIComponent(encoded);
}
