#!/usr/bin/env bash
#
# dev.sh — run the Veil coordinator and dapp together for local development.
# Assumes pools are already deployed (deployments/<network>.json exists) and the
# trusted setup is complete (circuits/output/main_final.zkey).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

NETWORK="${1:-testnet}"
[ -f "$ROOT/deployments/$NETWORK.json" ] || {
  echo "No deployment manifest for $NETWORK. Run scripts/deploy-pools.sh $NETWORK first." >&2
  exit 1
}

cleanup() { kill 0 2>/dev/null || true; }
trap cleanup EXIT INT TERM

echo "▸ starting relayer/ASP coordinator on :8787"
( cd "$ROOT/services/relayer" && VEIL_NETWORK="$NETWORK" npm start ) &

echo "▸ starting dapp on :5173"
( cd "$ROOT/app" && npm run dev ) &

wait
