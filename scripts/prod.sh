#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${DATABASE_URL:?Set DATABASE_URL in .env or the environment}"

export NODE_ENV=production
export PORT="${PORT:-3000}"

PID_FILE=".prod.pid"
LOG_FILE="logs/prod.log"

if [[ -f "$PID_FILE" ]]; then
  existing_pid="$(cat "$PID_FILE")"
  if kill -0 "$existing_pid" 2>/dev/null; then
    echo "Production server already running as pid ${existing_pid} on port ${PORT}."
    echo "Logs: ${LOG_FILE}"
    exit 0
  fi
  rm -f "$PID_FILE"
fi

echo "Installing dependencies…"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

echo "Generating Prisma client…"
npx prisma generate

echo "Applying database migrations…"
npx prisma migrate deploy

echo "Building…"
npm run build

mkdir -p logs

echo "Starting production server on port ${PORT} in the background…"
nohup npx next start -p "${PORT}" > "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"

echo "Started pid $(cat "$PID_FILE")."
echo "Logs: ${LOG_FILE}"
echo "Stop with: kill \$(cat ${PID_FILE})"
