#!/bin/bash
set -e

# Remove server.pid potencialmente existente para o Rails não travar ao iniciar
rm -f /app/tmp/pids/server.pid

# Executa o comando principal do container (que é o CMD do Dockerfile)
exec "$@"