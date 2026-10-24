#!/usr/bin/env bash
# Local Postgres 16 with the Supabase-shaped stub, migrations and FAKE seed. For dev and e2e only.
#   dev-db.sh start   start (creating + seeding on first run); prints nothing, URL is in .env.example
#   dev-db.sh reset   drop everything and reseed
#   dev-db.sh stop
set -euo pipefail
SELF="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
cd "$(dirname "$SELF")"
PGBIN=${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}
DIR=${DEVDB_DIR:-/tmp/eunike-devdb}; PORT=${DEVDB_PORT:-54329}
RUN="bash -c"; if [ "$(id -u)" = 0 ]; then RUN="su postgres -s /bin/bash -c"; fi
URL="host=127.0.0.1 port=$PORT user=postgres dbname=postgres"
running() { $RUN "$PGBIN/pg_isready -q -h 127.0.0.1 -p $PORT"; }
load() { for f in tests/00_stub_supabase.sql migrations/*.sql seed.sql; do psql "$URL" -v ON_ERROR_STOP=1 -q -f "$f" >/dev/null; done; }

case "${1:-start}" in
  stop) [ -d "$DIR/data" ] && $RUN "$PGBIN/pg_ctl -D $DIR/data -m fast stop >/dev/null" || true ;;
  reset) "$SELF" stop; rm -rf "$DIR"; "$SELF" start ;;
  start)
    if running; then exit 0; fi
    fresh=0
    if [ ! -d "$DIR/data" ]; then
      mkdir -p "$DIR"; chmod 755 "$DIR"; [ "$(id -u)" = 0 ] && chown postgres "$DIR"
      $RUN "$PGBIN/initdb -D $DIR/data -A trust >/dev/null"; fresh=1
    fi
    $RUN "$PGBIN/pg_ctl -D $DIR/data -o '-p $PORT -k $DIR -c listen_addresses=127.0.0.1' -w -l $DIR/log start >/dev/null"
    [ "$fresh" = 1 ] && load
    ;;
esac
