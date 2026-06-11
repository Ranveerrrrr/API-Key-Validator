#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIDFILE="$APP_DIR/bugatsec-v1.pid"

if [[ ! -f "$PIDFILE" ]]; then
  exit 0
fi

PID="$(cat "$PIDFILE" 2>/dev/null || true)"
if [[ -n "${PID:-}" ]] && kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
fi

rm -f "$PIDFILE"
