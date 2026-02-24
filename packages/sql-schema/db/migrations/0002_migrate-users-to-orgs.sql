-- Create a personal organization for each existing user (id = user.id so ClickHouse data maps without changes)
INSERT INTO "organization" ("id", "name", "slug", "created_at")
SELECT "id", "name" || '''s Workspace', lower(regexp_replace(split_part("email", '@', 1), '[^a-z0-9-]', '-', 'g')) || '-' || substr("id", 1, 8), now()
FROM "user"
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
-- Create owner membership for each user in their personal org
INSERT INTO "member" ("id", "organization_id", "user_id", "role", "created_at")
SELECT gen_random_uuid()::text, u."id", u."id", 'owner', now()
FROM "user" u
WHERE NOT EXISTS (
  SELECT 1 FROM "member" m WHERE m."user_id" = u."id" AND m."organization_id" = u."id"
);
--> statement-breakpoint
-- Set active org on existing sessions
UPDATE "session" SET "active_organization_id" = "user_id"
WHERE "active_organization_id" IS NULL;
