import { implement } from "@orpc/server";
import { contract } from "@repo/api-routes";

const os = implement(contract);

const health = os.health.handler(() => {
	return {
		status: "ok" as const,
		timestamp: Date.now(),
	};
});

export const router = os.router({
	health,
});
