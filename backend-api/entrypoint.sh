#!/bin/bash
set -e

mkdir -p /app/tmp/pids
rm -f /app/tmp/pids/server.pid

until pg_isready -h "${DATABASE_HOST:-db}" -p "${DATABASE_PORT:-5432}" -U "${DATABASE_USERNAME:-postgres}"; do
  echo "Aguardando PostgreSQL..."
  sleep 2
done

if [ "$1" = "bundle" ] && [ "$2" = "exec" ] && [ "$3" = "rails" ] && [ "$4" = "server" ]; then
  bundle exec rails db:prepare
elif [ "$1" = "bundle" ] && [ "$2" = "exec" ] && [ "$3" = "ruby" ] && [ "$4" = "bin/jobs" ]; then
  until bundle exec rails runner 'exit(ActiveRecord::Base.connection.data_source_exists?("solid_queue_jobs") && !ActiveRecord::Base.connection_pool.migration_context.needs_migration? ? 0 : 1)'; do
    echo "Aguardando migrations da API..."
    sleep 3
  done
fi

exec "$@"
