#!/usr/bin/env bash
#
# deploy-pools.sh — Production deploy for the Veil multi-denomination privacy pools.
#
# Deploys one PrivacyPools contract instance per denomination (each instance is its
# own anonymity set / Merkle tree), wires them to a token (XLM SAC on testnet by
# default), and writes a machine-readable deployment manifest that the relayer and
# frontend consume.
#
# Usage:
#   scripts/deploy-pools.sh [network] [identity]
#     network   testnet (default) | futurenet | local
#     identity  stellar CLI key name to deploy from (default: veil_admin)
#
# Requires: stellar CLI, jq, a completed trusted setup in circuits/output/.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

NETWORK="${1:-testnet}"
IDENTITY="${2:-veil_admin}"

# Token the pools hold. Default: XLM Stellar Asset Contract on testnet.
TOKEN_ADDRESS="${TOKEN_ADDRESS:-CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC}"

# Denominations in stroops. 1 XLM = 1_000_000_000 stroops in this project's convention.
DENOMS=(${DENOMS:-1000000000 10000000000 100000000000 1000000000000})

VK_JSON="circuits/output/main_verification_key.json"
WASM="target/wasm32v1-none/release/privacy_pools.wasm"
WASM_OPT="target/wasm32v1-none/release/privacy_pools.optimized.wasm"
MANIFEST_DIR="$ROOT/deployments"
MANIFEST="$MANIFEST_DIR/$NETWORK.json"

log() { printf '\033[36m▸ %s\033[0m\n' "$*"; }
die() { printf '\033[31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

command -v stellar >/dev/null 2>&1 || die "stellar CLI not found"
command -v jq >/dev/null 2>&1 || die "jq not found"
[ -f "$VK_JSON" ] || die "missing $VK_JSON — run the trusted setup first"

# --- identity ---------------------------------------------------------------
if ! stellar keys ls 2>/dev/null | grep -qx "$IDENTITY"; then
  log "generating identity '$IDENTITY'"
  stellar keys generate "$IDENTITY" >/dev/null 2>&1 || true
fi
log "funding '$IDENTITY' on $NETWORK"
stellar keys fund "$IDENTITY" --network "$NETWORK" >/dev/null 2>&1 || true
ADMIN_PK="$(stellar keys address "$IDENTITY")"
log "admin: $ADMIN_PK"

# --- build + optimize WASM --------------------------------------------------
log "building contract WASM"
cargo build --target wasm32v1-none --release -p privacy-pools
log "optimizing WASM"
stellar contract optimize --wasm "$WASM" --wasm-out "$WASM_OPT" >/dev/null

# --- verification key -> hex ------------------------------------------------
log "converting verification key"
VK_HEX="$(cargo run -q --bin stellar-circom2soroban vk "$VK_JSON" | grep -oE '[0-9a-f]{64,}$')"
[ -n "$VK_HEX" ] || die "failed to extract VK hex"

# --- deploy one instance per denomination -----------------------------------
mkdir -p "$MANIFEST_DIR"
POOLS_JSON="[]"

for DENOM in "${DENOMS[@]}"; do
  SCOPE="veil_pool_${DENOM}"
  log "deploying pool: denom=$DENOM scope=$SCOPE"
  OUT="$(stellar contract deploy \
    --wasm "$WASM_OPT" \
    --source "$IDENTITY" \
    --network "$NETWORK" \
    -- \
    --vk_bytes "$VK_HEX" \
    --token_address "$TOKEN_ADDRESS" \
    --admin "$ADMIN_PK" \
    --denom "$DENOM" 2>&1)"
  CID="$(echo "$OUT" | grep -oE 'C[A-Z0-9]{55}' | tail -1)"
  [ -n "$CID" ] || { echo "$OUT"; die "deploy failed for denom $DENOM"; }
  log "  -> $CID"
  POOLS_JSON="$(echo "$POOLS_JSON" | jq \
    --arg cid "$CID" --arg scope "$SCOPE" --argjson denom "$DENOM" \
    '. + [{contractId:$cid, denom:$denom, scope:$scope}]')"
done

# --- write manifest ---------------------------------------------------------
jq -n \
  --arg network "$NETWORK" \
  --arg token "$TOKEN_ADDRESS" \
  --arg admin "$ADMIN_PK" \
  --arg identity "$IDENTITY" \
  --argjson pools "$POOLS_JSON" \
  '{network:$network, token:$token, admin:$admin, adminIdentity:$identity, pools:$pools}' \
  > "$MANIFEST"

log "wrote manifest: $MANIFEST"
jq . "$MANIFEST"
log "done — $(echo "$POOLS_JSON" | jq length) pools live on $NETWORK"
