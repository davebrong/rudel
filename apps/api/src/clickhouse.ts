import { createClickHouseExecutor } from "@chkit/clickhouse";

type ClickHouseExecutor = ReturnType<typeof createClickHouseExecutor>;

let _clickhouse: ClickHouseExecutor | null = null;

export function getClickhouse(): ClickHouseExecutor {
	if (!_clickhouse) {
		const executor = createClickHouseExecutor({
			url: process.env.CLICKHOUSE_URL || "http://localhost:8123",
			username:
				process.env.CLICKHOUSE_USERNAME ||
				process.env.CLICKHOUSE_USER ||
				"default",
			password: process.env.CLICKHOUSE_PASSWORD || "",
			database: "default",
		});
		const maxRetries = 3;
		_clickhouse = {
			...executor,
			async insert(params) {
				for (let attempt = 0; attempt < maxRetries; attempt++) {
					try {
						return await executor.insert(params);
					} catch (error) {
						// Retry on INSERT race conditions (ClickHouse code 236)
						if (attempt === maxRetries - 1) throw error;
						await new Promise((r) =>
							setTimeout(r, 100 * (attempt + 1)),
						);
					}
				}
			},
		};
	}
	return _clickhouse;
}
