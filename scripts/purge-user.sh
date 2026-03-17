#!/usr/bin/env bash
set -euo pipefail

PG_CONTAINER="rudel-postgres-1"
CH_CONTAINER="rudel-clickhouse-1"
DB="rudel"

read -rp "Email address of user to purge: " EMAIL

if [[ -z "$EMAIL" ]]; then
  echo "Error: email cannot be empty"
  exit 1
fi

# Look up user ID before deleting (needed for ClickHouse purge)
USER_ID=$(docker exec -i "$PG_CONTAINER" psql -U postgres -d "$DB" -t -A -c \
  "SELECT id FROM \"user\" WHERE email = '$EMAIL'")

if [[ -z "$USER_ID" ]]; then
  echo "Error: no user found with email '$EMAIL'"
  exit 1
fi

echo ""
echo "Found user: $EMAIL (id: $USER_ID)"
echo "This will permanently delete the user and all associated data from Postgres and ClickHouse."
read -rp "Are you sure? (y/N): " CONFIRM

if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo "Purging from Postgres..."
docker exec -i "$PG_CONTAINER" psql -U postgres -d "$DB" -c "
BEGIN;

-- Delete orgs where this user is the only member
DELETE FROM organization WHERE id IN (
  SELECT m.organization_id FROM member m
  JOIN \"user\" u ON u.id = m.user_id
  WHERE u.email = '$EMAIL'
  AND m.organization_id NOT IN (
    SELECT organization_id FROM member
    WHERE user_id != (SELECT id FROM \"user\" WHERE email = '$EMAIL')
  )
);

-- Delete API keys
DELETE FROM apikey WHERE reference_id = (SELECT id FROM \"user\" WHERE email = '$EMAIL');

-- Delete verification entries
DELETE FROM verification WHERE identifier = '$EMAIL';

-- Delete user (cascades to session, account, member, invitation, deviceCode)
DELETE FROM \"user\" WHERE email = '$EMAIL';

COMMIT;
"

echo "Purging from ClickHouse..."
docker exec -i "$CH_CONTAINER" clickhouse-client -q \
  "ALTER TABLE rudel.claude_sessions DELETE WHERE organization_id = '$USER_ID'"
docker exec -i "$CH_CONTAINER" clickhouse-client -q \
  "ALTER TABLE rudel.session_analytics DELETE WHERE organization_id = '$USER_ID'"

echo ""
echo "User '$EMAIL' (id: $USER_ID) has been fully purged from Postgres and ClickHouse."
