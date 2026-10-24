#!/usr/bin/env bash
# pnpm db:test. Uses DATABASE_URL (e.g. `supabase start`) when set, otherwise a throwaway local Postgres 16.
set -euo pipefail
cd "$(dirname "$0")/.."
PGBIN=${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}

if [ -n "${DATABASE_URL:-}" ]; then
  URL="$DATABASE_URL"; CLEAN=""
else
  DIR=$(mktemp -d); chmod 755 "$DIR"; PORT=${PGPORT:-54329}
  RUN="bash -c"; if [ "$(id -u)" = 0 ]; then chown postgres "$DIR"; RUN="su postgres -s /bin/bash -c"; fi
  $RUN "$PGBIN/initdb -D $DIR/data -A trust >/dev/null"
  $RUN "$PGBIN/pg_ctl -D $DIR/data -o '-p $PORT -k $DIR -c listen_addresses=' -w -l $DIR/log start >/dev/null"
  URL="host=$DIR port=$PORT user=postgres dbname=postgres"
  CLEAN="$RUN '$PGBIN/pg_ctl -D $DIR/data -m immediate stop >/dev/null'; rm -rf $DIR"
  trap 'eval "$CLEAN"' EXIT
  psql "$URL" -v ON_ERROR_STOP=1 -q -f tests/00_stub_supabase.sql
fi

for f in migrations/*.sql; do psql "$URL" -v ON_ERROR_STOP=1 -q -f "$f"; done
psql "$URL" -v ON_ERROR_STOP=1 -q -f seed.sql
for f in tests/rls.sql tests/rls_sk.sql; do psql "$URL" -v ON_ERROR_STOP=1 -q -f "$f" 2>&1 >/dev/null | sed -e "s/^psql:[^ ]* //" -e "s/^NOTICE:  //"; done
