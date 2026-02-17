import type { IngestRequest, UploadResult } from "./types.js";

export interface UploadConfig {
	endpoint: string;
	token: string;
}

/**
 * Upload a session transcript to the backend endpoint.
 */
export async function uploadSession(
	request: IngestRequest,
	config: UploadConfig,
): Promise<UploadResult> {
	try {
		const response = await fetch(config.endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${config.token}`,
			},
			body: JSON.stringify(request),
		});

		const responseText = await response.text();

		if (!response.ok) {
			return {
				success: false,
				status: response.status,
				error: `HTTP ${response.status}: ${responseText}`,
			};
		}

		return { success: true, status: response.status };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}
