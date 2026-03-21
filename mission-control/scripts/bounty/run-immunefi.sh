#!/bin/bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT_DIR/../logs/bounty"
if [ -f "$ROOT_DIR/../.env.local" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/../.env.local" >/dev/null 2>&1 || true
  set +a
fi
if [ -f "$ROOT_DIR/../../.openclaw/workspace/secrets/env.mission-control" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/../../.openclaw/workspace/secrets/env.mission-control" >/dev/null 2>&1 || true
  set +a
fi
mkdir -p "$LOG_DIR"
STAMP=$(date -u +"%Y%m%dT%H%M%SZ")
LOG_FILE="$LOG_DIR/immunefi-$STAMP.log"

cd "$ROOT_DIR/.."
{
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] starting immunefi ingest"
  npm run bounty:immunefi
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] immunefi ingest complete"
} >>"$LOG_FILE" 2>&1
