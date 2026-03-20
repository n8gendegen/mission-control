#!/bin/bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
LOG_DIR="$ROOT_DIR/logs/ops"
mkdir -p "$LOG_DIR"
STAMP=$(date -u +"%Y%m%dT%H%M%SZ")
LOG_FILE="$LOG_DIR/auto-reassign-$STAMP.log"

if [ -f "$ROOT_DIR/.env.local" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env.local" >/dev/null 2>&1 || true
  set +a
fi
if [ -f "$ROOT_DIR/../workspace/secrets/env.mission-control" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/../workspace/secrets/env.mission-control" >/dev/null 2>&1 || true
  set +a
fi

cd "$ROOT_DIR"/mission-control
{
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] starting auto-reassign sweep"
  node scripts/ops/agent-auto-reassign.mjs
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] sweep complete"
} >>"$LOG_FILE" 2>&1
