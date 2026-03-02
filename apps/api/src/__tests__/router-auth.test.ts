import { beforeEach, describe, expect, mock, test } from "bun:test";

let mockQueryResult: unknown[] = [];

const chainMock = {
	select: mock(() => chainMock),
	from: mock(() => chainMock),
	where: mock(() => chainMock),
	innerJoin: mock(() => chainMock),
	limit: mock(() => Promise.resolve(mockQueryResult)),
};

const mockIngestSession = mock(() => Promise.resolve());

mock.module("../db.js", () => ({ db: chainMock }));
mock.module("../clickhouse.js", () => ({ getClickhouse: () => ({}) }));
mock.module("../ingest.js", () => ({
	ingestSession: mockIngestSession,
	buildSessionRow: mock(() => ({})),
	extractTimestampRange: mock(() => null),
}));
mock.module("../handlers/analytics/index.js", () => ({
	analyticsRouter: {},
}));

const { RPCHandler } = await import("@orpc/server/fetch");
const { router } = await import("../router.js");

const handler = new RPCHandler(router);

function rpcRequest(path: string, body: unknown) {
	return new Request(`http://localhost/rpc/${path}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ json: body, meta: [] }),
	});
}

const authedContext = {
	user: {
		id: "user-1",
		email: "test@example.com",
		name: "Test User",
		image: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		emailVerified: true,
	},
	session: {
		id: "sess-1",
		token: "tok",
		userId: "user-1",
		activeOrganizationId: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		expiresAt: new Date(Date.now() + 86400000),
	},
};

const validInput = {
	sessionId: "s1",
	projectPath: "/test",
	content: "test content",
};

describe("ingestSession authorization", () => {
	beforeEach(() => {
		mockQueryResult = [];
		mockIngestSession.mockReset();
		mockIngestSession.mockImplementation(() => Promise.resolve());
		for (const fn of Object.values(chainMock)) {
			(fn as ReturnType<typeof mock>).mockClear();
		}
	});

	test("user can ingest into an org they belong to", async () => {
		mockQueryResult = [{ id: "membership-1" }];

		const result = await handler.handle(
			rpcRequest("ingestSession", { ...validInput, organizationId: "org-1" }),
			{ prefix: "/rpc", context: authedContext },
		);

		expect(result.matched).toBe(true);
		expect(result.response?.status).toBe(200);
		expect(mockIngestSession).toHaveBeenCalledTimes(1);
	});

	test("user cannot ingest into an org they do not belong to", async () => {
		mockQueryResult = [];

		const result = await handler.handle(
			rpcRequest("ingestSession", {
				...validInput,
				organizationId: "other-org",
			}),
			{ prefix: "/rpc", context: authedContext },
		);

		expect(result.matched).toBe(true);
		expect(result.response?.status).not.toBe(200);
		expect(mockIngestSession).not.toHaveBeenCalled();
	});

	test("omitting organizationId skips membership check and succeeds", async () => {
		const result = await handler.handle(
			rpcRequest("ingestSession", validInput),
			{ prefix: "/rpc", context: authedContext },
		);

		expect(result.matched).toBe(true);
		expect(result.response?.status).toBe(200);
		expect(mockIngestSession).toHaveBeenCalledTimes(1);
		// Should not query for membership at all
		expect(chainMock.where).not.toHaveBeenCalled();
	});
});
