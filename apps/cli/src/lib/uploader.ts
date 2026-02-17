import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import type { contract } from "@rudel/api-routes";
import type { IngestRequest, UploadResult } from "./types.js";

export interface UploadConfig {
	endpoint: string;
	token: string;
}

/**
 * Upload a session transcript to the backend via oRPC.
 */
export async function uploadSession(
	request: IngestRequest,
	config: UploadConfig,
): Promise<UploadResult> {
	const link = new RPCLink({
		url: config.endpoint,
		headers: {
			Authorization: `Bearer ${config.token}`,
		},
	});

	const client: ContractRouterClient<typeof contract> = createORPCClient(link);

	try {
		await client.ingestSession(request);
		return { success: true, status: 200 };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}
