import { describe, expect, test } from "bun:test";
import {
	DeveloperDetailsInputSchema,
	SessionDetailInputSchema,
	SessionListInputSchema,
} from "../schemas/analytics.js";

describe("analytics input schemas", () => {
	test("reject oversized free-form analytics filters", () => {
		expect(() =>
			DeveloperDetailsInputSchema.parse({
				days: 7,
				userId: "a".repeat(513),
			}),
		).toThrow();
		expect(() =>
			SessionListInputSchema.parse({
				days: 7,
				projectPath: "a".repeat(4097),
			}),
		).toThrow();
		expect(() =>
			SessionDetailInputSchema.parse({
				sessionId: "a".repeat(513),
			}),
		).toThrow();
	});
});
