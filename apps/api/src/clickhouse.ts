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
			await client.insert({
				table: params.table,
				values: params.values,
				format: "JSONEachRow",
			});
		},
	};
}

let _clickhouse: ClickHouseExecutor | null = null;

export function getClickhouse(): ClickHouseExecutor {
	if (!_clickhouse) {
		_clickhouse = createClickHouseExecutor({
			url: process.env.CLICKHOUSE_URL || "http://localhost:8123",
			username:
				process.env.CLICKHOUSE_USERNAME ||
				process.env.CLICKHOUSE_USER ||
				"default",
			password: process.env.CLICKHOUSE_PASSWORD || "",
			database: "default",
		});
	}
	return _clickhouse;
}
