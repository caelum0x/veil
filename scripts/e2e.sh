#!/usr/bin/env bash
#
# e2e.sh — full deposit -> withdraw against a *deployed* Veil pool on testnet.
# Proves the Groth16 withdrawal proof verifies on-chain and funds move to a fresh,
# unrelated recipient. Reads the pool from deployments/<network>.json.
#
# Usage: scripts/e2e.sh [network] [pool-index]
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export PATH="$HOME/.cargo/bin:$PATH"

NETWORK="${1:-testnet}"
IDX="${2:-0}"
MANIFEST="deployments/$NETWORK.json"
ADMIN="$(jq -r .adminIdentity "$MANIFEST")"
CID="$(jq -r ".pools[$IDX].contractId" "$MANIFEST")"
DENOM="$(jq -r ".pools[$IDX].denom" "$MANIFEST")"
SCOPE="$(jq -r ".pools[$IDX].scope" "$MANIFEST")"

COIN=/tmp/veil-e2e-coin.json
STATE=/tmp/veil-e2e-state.json
ASSOC=/tmp/veil-e2e-assoc.json
INPUT=/tmp/veil-e2e-input.json
rm -f "$COIN" "$STATE" "$ASSOC" "$INPUT"

COINUTILS=target/release/stellar-coinutils
C2S=target/release/stellar-circom2soroban

log() { printf '\033[36m▸ %s\033[0m\n' "$*"; }

log "pool[$IDX]: $CID  denom=$DENOM  scope=$SCOPE"

# Fresh, unrelated recipient — the whole point is that this account has no link to
# the depositor.
if ! stellar keys ls | grep -qx veil_recipient; then stellar keys generate veil_recipient >/dev/null 2>&1; fi
stellar keys fund veil_recipient --network "$NETWORK" >/dev/null 2>&1 || true
RECIPIENT="$(stellar keys address veil_recipient)"
log "recipient (fresh): $RECIPIENT"

# 1. mint coin at this pool's denomination
log "minting coin"
"$COINUTILS" generate "$SCOPE" -o "$COIN" --value "$DENOM" >/dev/null
COMMIT_HEX="$(jq -r .commitment_hex "$COIN" | sed 's/^0x//')"
COMMIT_DEC="$(jq -r .coin.commitment "$COIN")"
LABEL="$(jq -r .coin.label "$COIN")"

# 2. deposit (admin pays the denomination into the pool)
log "deposit"
stellar contract invoke --id "$CID" --source "$ADMIN" --network "$NETWORK" -- \
  deposit --from "$ADMIN" --commitment "$COMMIT_HEX"

# 3. state file (commitments in insertion order)
echo "{\"commitments\":[\"$COMMIT_DEC\"],\"scope\":\"$SCOPE\"}" > "$STATE"

# 4. association set + publish root (admin)
log "association set + set_association_root"
"$COINUTILS" update-association "$ASSOC" "$LABEL" >/dev/null
ROOT_DEC="$(jq -r .root "$ASSOC")"
ROOT_HEX="$(python3 -c "print(hex(int('$ROOT_DEC'))[2:].zfill(64))")"
stellar contract invoke --id "$CID" --source "$ADMIN" --network "$NETWORK" -- \
  set_association_root --caller "$ADMIN" --association_root "$ROOT_HEX"

# 5. build SNARK input + prove
log "building withdrawal input + Groth16 proof"
"$COINUTILS" withdraw "$COIN" "$STATE" "$ASSOC" -o "$INPUT" >/dev/null
( cd circuits
  node build/main_js/generate_witness.js build/main_js/main.wasm "$INPUT" /tmp/veil-e2e.wtns
  snarkjs groth16 prove output/main_final.zkey /tmp/veil-e2e.wtns /tmp/veil-e2e-proof.json /tmp/veil-e2e-public.json )

PROOF_HEX="$("$C2S" proof /tmp/veil-e2e-proof.json | sed -n '/Proof Hex encoding:/{n;p;}' | tr -d '[:space:]' | sed 's/^0x//')"
PUBLIC_HEX="$("$C2S" public /tmp/veil-e2e-public.json | sed -n '/Public signals Hex encoding:/{n;p;}' | tr -d '[:space:]' | sed 's/^0x//')"

# 6. withdraw to the fresh recipient — verifies the proof on-chain
log "withdraw -> $RECIPIENT (verifies proof on-chain)"
stellar contract invoke --id "$CID" --source veil_recipient --network "$NETWORK" -- \
  withdraw --to "$RECIPIENT" --proof_bytes "$PROOF_HEX" --pub_signals_bytes "$PUBLIC_HEX"

log "nullifiers now recorded:"
stellar contract invoke --id "$CID" --source "$ADMIN" --network "$NETWORK" -- get_nullifiers
log "✅ e2e complete — $((DENOM/1000000000)) XLM withdrawn to a fresh account with an on-chain ZK proof"
