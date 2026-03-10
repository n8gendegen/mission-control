#!/bin/bash
set -euo pipefail
WORKSPACE="/Users/natemacdaddy/.openclaw/workspace"
cd "$WORKSPACE/mission-control"
if [ -f .env.local ]; then
  set -a
  source .env.local
  set +a
fi
mkdir -p "$WORKSPACE/logs/agents"
LOG_FILE="$WORKSPACE/logs/agents/auto-assign.log"
{
  timestamp=$(date -u "+%Y-%m-%dT%H:%M:%SZ")
  echo "[$timestamp] Auto-assign run started"
  node scripts/auto-assign-tasks.mjs --limit ${AUTO_ASSIGN_LIMIT:-30}
  status=$?
  timestamp=$(date -u "+%Y-%m-%dT%H:%M:%SZ")
  echo "[$timestamp] Auto-assign run completed (exit=$status)"
  exit $status
} >> "$LOG_FILE" 2>&1
