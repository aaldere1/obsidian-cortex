#!/bin/bash
# Public checkout shim: only the verified private brain may sync skills.
set -euo pipefail
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)
VAULT=$(node "$SCRIPT_DIR/../brain.mjs" --private-vault-path) || exit 1
export BRAIN_VAULT="$VAULT"
exec bash "$VAULT/AI Brain/scripts/hooks/brain-skill-sync.sh" "$@"
