#!/usr/bin/env bash
#
# validate-relayer.sh — drive the relayer/ASP coordinator HTTP API against a *live*
# deployed pool: mint note -> deposit on-chain -> confirm (relayer publishes the
# association root) -> request proof from relayer -> submit withdraw on-chain.
#
# Proves the production service path (the one the dapp uses), not just the CLI.
# Use a pool index the relayer hasn't tracked yet so its state mirrors the chain.
#
# Usage: scripts/validate-relayer.sh [pool-index]
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export PATH="$HOME/.cargo/bin:$PATH"

NETWORK=testnet
IDX="${1:-1}"
PORT=8788
MANIFEST="deployments/$NETWORK.json"
DENOM="$(jq -r ".pools[$IDX].denom" "$MANIFEST")"
CID="$(jq -r ".pools[$IDX].contractId" "$MANIFEST")"
ADMIN="$(jq -r .adminIdentity "$MANIFEST")"
BASE="http://localhost:$PORT"
log() { printf '\033[36m▸ %s\033[0m\n' "$*"; }

# fresh recipient
if ! stellar keys ls | grep -qx veil_rtest; then stellar keys generate veil_rtest >/dev/null 2>&1; fi
stellar keys fund veil_rtest --network "$NETWORK" >/dev/null 2>&1 || true
RECIP="$(stellar keys address veil_rtest)"
log "pool[$IDX] $CID  denom=$DENOM  recipient=$RECIP"

# start relayer
( cd services/relayer && PORT=$PORT VEIL_NETWORK=$NETWORK npm start >/tmp/veil-relayer-validate.log 2>&1 ) &
RPID=$!
cleanup() { kill $RPID 2>/dev/null || true; }
trap cleanup EXIT
for i in $(seq 1 30); do curl -sf "$BASE/api/health" >/dev/null 2>&1 && break; sleep 1; done
curl -sf "$BASE/api/health" >/dev/null || { echo "relayer did not start"; cat /tmp/veil-relayer-validate.log; exit 1; }

# 1. mint note via relayer
log "POST /api/notes"
curl -s -X POST "$BASE/api/notes" -H 'content-type: application/json' -d "{\"denom\":$DENOM}" > /tmp/veil-note.json
NOTE="$(jq -c .note /tmp/veil-note.json)"
COMMIT_HEX="$(jq -r .commitmentHex /tmp/veil-note.json | sed 's/^0x//')"
[ -n "$COMMIT_HEX" ] && [ "$COMMIT_HEX" != "null" ] || { echo "no commitment from relayer"; cat /tmp/veil-note.json; exit 1; }

# 2. deposit on-chain (depositor signs)
log "deposit on-chain"
stellar contract invoke --id "$CID" --source "$ADMIN" --network "$NETWORK" -- \
  deposit --from "$ADMIN" --commitment "$COMMIT_HEX"

# 3. relayer confirms: records commitment + publishes association root on-chain
log "POST /api/deposits/confirm (relayer sets association root)"
curl -s -X POST "$BASE/api/deposits/confirm" -H 'content-type: application/json' \
  -d "{\"denom\":$DENOM,\"note\":$NOTE}"; echo

# 4. relayer generates the withdrawal proof
log "POST /api/withdraw (relayer proves)"
curl -s -X POST "$BASE/api/withdraw" -H 'content-type: application/json' \
  -d "{\"denom\":$DENOM,\"note\":$NOTE,\"recipient\":\"$RECIP\"}" > /tmp/veil-wd.json
PROOF="$(jq -r .proofHex /tmp/veil-wd.json)"
PUBLIC="$(jq -r .publicHex /tmp/veil-wd.json)"
[ -n "$PROOF" ] && [ "$PROOF" != "null" ] || { echo "no proof from relayer"; cat /tmp/veil-wd.json; exit 1; }

# 5. submit withdraw on-chain (recipient signs) — verifies the proof on-chain
log "withdraw on-chain -> $RECIP"
stellar contract invoke --id "$CID" --source veil_rtest --network "$NETWORK" -- \
  withdraw --to "$RECIP" --proof_bytes "$PROOF" --pub_signals_bytes "$PUBLIC"

log "✅ relayer-driven e2e complete on live pool[$IDX]"
