import { oc } from "@orpc/contract";
import { z } from "zod";

export const HealthSchema = z.object({
	status: z.literal("ok"),
	timestamp: z.number(),
});

export const contract = {
	health: oc.output(HealthSchema),
};
