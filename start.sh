#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-8099}"
HOST="${HOST:-0.0.0.0}"
PIDFILE="$APP_DIR/bugatsec-v1.pid"
LOGFILE="$APP_DIR/bugatsec-v1.log"

cd "$APP_DIR"

if [[ -f "$PIDFILE" ]]; then
  PID="$(cat "$PIDFILE" 2>/dev/null || true)"
  if [[ -n "${PID:-}" ]] && kill -0 "$PID" 2>/dev/null; then
    exit 0
  fi
fi

if command -v ss >/dev/null 2>&1 && ss -ltn "sport = :$PORT" | grep -q ":$PORT"; then
  exit 0
fi

HOST="$HOST" PORT="$PORT" nohup node "$APP_DIR/server.js" >> "$LOGFILE" 2>&1 &
echo "$!" > "$PIDFILE"
