import { createClient } from "@clickhouse/client-web";

export interface ClickHouseExecutor {
	execute(sql: string): Promise<void>;
	query<T>(sql: string): Promise<T[]>;
	insert<T extends Record<string, unknown>>(params: {
		table: string;
		values: T[];
	}): Promise<void>;
}

export function createClickHouseExecutor(config: {
	url: string;
	username?: string;
	password?: string;
	database?: string;
}): ClickHouseExecutor {
	const client = createClient({
		url: config.url,
		username: config.username,
		password: config.password,
		database: config.database,
		clickhouse_settings: {
			wait_end_of_query: 1,
		},
	});
	return {
		async execute(sql) {
			await client.command({ query: sql });
		},
		async query<T>(sql: string): Promise<T[]> {
			const result = await client.query({
				query: sql,
				format: "JSONEachRow",
			});
			return result.json();
		},
		async insert(params) {
			// Use command() with FORMAT JSONEachRow instead of client.insert()
			// because ClickHouse Cloud's @clickhouse/client insert() silently drops data.
			const rows = params.values.map((r) => JSON.stringify(r)).join("\n");
			await client.command({
				query: `INSERT INTO ${params.table} SETTINGS async_insert=0 FORMAT JSONEachRow ${rows}`,
			});
		},
	};
}

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
						await new Promise((r) => setTimeout(r, 100 * (attempt + 1)));
					}
				}
			},
		};
	}
	return _clickhouse;
}
