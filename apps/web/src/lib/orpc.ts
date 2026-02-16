import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { contract } from "@repo/api-routes";

const link = new RPCLink({
	url: "http://localhost:4010/rpc",
});

export const client: ContractRouterClient<typeof contract> =
	createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
