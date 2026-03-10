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
LOG_FILE="$WORKSPACE/logs/agents/builder-session-runner.log"
AGENT_NAME=${BUILDER_AGENT_NAME:-Steve}
AGENT_INITIALS=${BUILDER_OWNER_INITIALS:-St}
SESSION_LIMIT=${BUILDER_SESSION_LIMIT:-1}
{
  timestamp=$(date -u "+%Y-%m-%dT%H:%M:%SZ")
  echo "[$timestamp] Builder session runner starting for $AGENT_NAME"
  node scripts/builder-session-runner.mjs --agent "$AGENT_NAME" --initials "$AGENT_INITIALS" --limit "$SESSION_LIMIT"
  status=$?
  timestamp=$(date -u "+%Y-%m-%dT%H:%M:%SZ")
  echo "[$timestamp] Builder session runner completed (exit=$status)"
  exit $status
} >> "$LOG_FILE" 2>&1
