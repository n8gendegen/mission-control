#!/usr/bin/env bash
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
cd "$(dirname "$0")/.."
if [ -f .env.local ]; then
  set -a
  source .env.local
  set +a
fi
export NODE_TLS_REJECT_UNAUTHORIZED=0
NODE_BIN="${NODE_BIN:-/opt/homebrew/bin/node}"
"$NODE_BIN" scripts/agent-runner.mjs --agent Splitter "$@"
