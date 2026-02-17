import { oc } from "@orpc/contract";
import { z } from "zod";

export const HealthSchema = z.object({
	status: z.literal("ok"),
	timestamp: z.number(),
});

export const UserSchema = z.object({
	id: z.string(),
	email: z.string(),
	name: z.string(),
});

export const contract = {
	health: oc.output(HealthSchema),
	me: oc.output(UserSchema),
};
