import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import type { contract } from "@rudel/api-routes";

export interface ClientConfig {
	apiBaseUrl: string;
	token: string;
}

export function createApiClient(
	config: ClientConfig,
): ContractRouterClient<typeof contract> {
	const link = new RPCLink({
		url: `${config.apiBaseUrl}/rpc`,
		headers: {
			Authorization: `Bearer ${config.token}`,
		},
	});
	return createORPCClient(link);
}
