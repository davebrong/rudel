import { createClickHouseExecutor } from "../apps/api/src/clickhouse.js";
import { extractTimestampRange } from "../apps/api/src/ingest.js";
import type { RudelClaudeSessionsRow } from "../packages/ch-schema/src/generated/chkit-types.js";
import { writeFileSync } from "node:fs";

const BATCH_SIZE = 10;

function toClickHouseDateTime(isoString: string): string {
	return isoString.replace("T", " ").replace("Z", "").replace(/\+.*$/, "");
}

async function main() {
	const apply = process.argv.includes("--apply");

	const executor = createClickHouseExecutor({
		url: process.env.CLICKHOUSE_URL || "http://localhost:8123",
		username:
			process.env.CLICKHOUSE_USERNAME ||
			process.env.CLICKHOUSE_USER ||
			"default",
		password: process.env.CLICKHOUSE_PASSWORD || "",
		database: "default",
	});

	console.log("Reading all sessions from rudel.claude_sessions...");
	const rows = await executor.query<RudelClaudeSessionsRow>(
		"SELECT * FROM rudel.claude_sessions FINAL",
	);
	console.log(`Found ${rows.length} sessions.`);

	if (rows.length === 0) {
		console.log("No sessions to reingest.");
		return;
	}

	let corrected = 0;
	let unchanged = 0;
	const updatedRows: RudelClaudeSessionsRow[] = [];

	for (const row of rows) {
		const timestamps = extractTimestampRange(row.content);
		const now = new Date().toISOString().replace("Z", "");

		if (timestamps) {
			updatedRows.push({
				...row,
				session_date: toClickHouseDateTime(timestamps.sessionDate),
				last_interaction_date: toClickHouseDateTime(
					timestamps.lastInteractionDate,
				),
				ingested_at: now,
			});
			corrected++;
		} else {
			updatedRows.push({
				...row,
				ingested_at: now,
			});
			unchanged++;
		}
	}

	console.log(
		`\nTimestamp extraction summary:\n  Corrected: ${corrected}\n  No timestamps found (kept original): ${unchanged}\n  Total: ${rows.length}`,
	);

	if (!apply) {
		console.log("\nDry run — no mutations applied. Use --apply to execute.");

		// Show a few examples
		const examples = updatedRows.slice(0, 3);
		for (const row of examples) {
			const original = rows.find((r) => r.session_id === row.session_id);
			console.log(`\n  session_id: ${row.session_id}`);
			console.log(`    before: session_date=${original?.session_date}`);
			console.log(`    after:  session_date=${row.session_date}`);
		}
		return;
	}

	// Save backup before any mutations
	const backupPath = `reingest-backup-${Date.now()}.json`;
	console.log(`\nSaving backup to ${backupPath}...`);
	writeFileSync(backupPath, JSON.stringify(rows, null, 2));
	console.log(`Backup saved (${rows.length} rows).`);

	// Truncate session_analytics first (MV will repopulate)
	console.log("\nTruncating rudel.session_analytics...");
	await executor.execute("TRUNCATE TABLE rudel.session_analytics");

	// Truncate claude_sessions
	console.log("Truncating rudel.claude_sessions...");
	await executor.execute("TRUNCATE TABLE rudel.claude_sessions");

	// Wait for ClickHouse Cloud propagation
	console.log("Waiting for propagation...");
	await new Promise((r) => setTimeout(r, 5000));

	// Re-insert in batches
	console.log(`\nRe-inserting ${updatedRows.length} sessions in batches of ${BATCH_SIZE}...`);
	for (let i = 0; i < updatedRows.length; i += BATCH_SIZE) {
		const batch = updatedRows.slice(i, i + BATCH_SIZE);
		await executor.insert({
			table: "rudel.claude_sessions",
			values: batch,
		});
		console.log(
			`  Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(updatedRows.length / BATCH_SIZE)}`,
		);
	}

	console.log("\nDone. MV will populate session_analytics from the inserts.");
	console.log(
		"Verify with:\n  SELECT count() FROM rudel.claude_sessions\n  SELECT count() FROM rudel.session_analytics\n  SELECT session_date, ingested_at FROM rudel.claude_sessions LIMIT 5",
	);
}

main().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
