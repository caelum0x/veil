#!/usr/bin/env bash
#
# e2e-multi.sh — proves the incremental-tree fix: TWO deposits into the same pool
# (the 2nd previously failed with Budget/ExceededLimit) followed by a withdrawal of
# the FIRST coin against the 2-leaf tree (proves the on-chain incremental root matches
# the off-chain LeanIMT root the proof is built against).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"; cd "$ROOT"
export PATH="$HOME/.cargo/bin:$PATH"

NETWORK=testnet; IDX="${1:-0}"; MANIFEST="deployments/$NETWORK.json"
ADMIN="$(jq -r .adminIdentity "$MANIFEST")"
CID="$(jq -r ".pools[$IDX].contractId" "$MANIFEST")"
DENOM="$(jq -r ".pools[$IDX].denom" "$MANIFEST")"
SCOPE="$(jq -r ".pools[$IDX].scope" "$MANIFEST")"
COINUTILS=target/release/stellar-coinutils
C2S=target/release/stellar-circom2soroban
log() { printf '\033[36m▸ %s\033[0m\n' "$*"; }
W=/tmp/veilm; rm -rf "$W"; mkdir -p "$W"

log "pool[$IDX] $CID denom=$DENOM"
if ! stellar keys ls | grep -qx veil_rtest; then stellar keys generate veil_rtest >/dev/null 2>&1; fi
stellar keys fund veil_rtest --network "$NETWORK" >/dev/null 2>&1 || true
RECIP="$(stellar keys address veil_rtest)"

# mint two coins
"$COINUTILS" generate "$SCOPE" -o "$W/a.json" --value "$DENOM" >/dev/null
"$COINUTILS" generate "$SCOPE" -o "$W/b.json" --value "$DENOM" >/dev/null
AC_HEX="$(jq -r .commitment_hex "$W/a.json" | sed 's/^0x//')"; AC_DEC="$(jq -r .coin.commitment "$W/a.json")"; AL="$(jq -r .coin.label "$W/a.json")"
BC_HEX="$(jq -r .commitment_hex "$W/b.json" | sed 's/^0x//')"; BC_DEC="$(jq -r .coin.commitment "$W/b.json")"; BL="$(jq -r .coin.label "$W/b.json")"

log "deposit #1 (coin A)"
stellar contract invoke --id "$CID" --source "$ADMIN" --network "$NETWORK" -- deposit --from "$ADMIN" --commitment "$AC_HEX" >/dev/null
log "deposit #2 (coin B)  <-- this is the call that used to fail with Budget/ExceededLimit"
stellar contract invoke --id "$CID" --source "$ADMIN" --network "$NETWORK" -- deposit --from "$ADMIN" --commitment "$BC_HEX" >/dev/null
log "both deposits succeeded ✅"

# state in insertion order [A, B]
echo "{\"commitments\":[\"$AC_DEC\",\"$BC_DEC\"],\"scope\":\"$SCOPE\"}" > "$W/state.json"
# association set with both labels
"$COINUTILS" update-association "$W/assoc.json" "$AL" >/dev/null
"$COINUTILS" update-association "$W/assoc.json" "$BL" >/dev/null
ROOT_DEC="$(jq -r .root "$W/assoc.json")"
ROOT_HEX="$(python3 -c "print(hex(int('$ROOT_DEC'))[2:].zfill(64))")"
stellar contract invoke --id "$CID" --source "$ADMIN" --network "$NETWORK" -- set_association_root --caller "$ADMIN" --association_root "$ROOT_HEX" >/dev/null

log "proving withdrawal of coin A against the 2-leaf tree"
"$COINUTILS" withdraw "$W/a.json" "$W/state.json" "$W/assoc.json" -o "$W/in.json" >/dev/null
( cd circuits
  node build/main_js/generate_witness.js build/main_js/main.wasm "$W/in.json" "$W/w.wtns" >/dev/null
  snarkjs groth16 prove output/main_final.zkey "$W/w.wtns" "$W/proof.json" "$W/public.json" >/dev/null )
PROOF_HEX="$("$C2S" proof "$W/proof.json" | sed -n '/Proof Hex encoding:/{n;p;}' | tr -d '[:space:]' | sed 's/^0x//')"
PUBLIC_HEX="$("$C2S" public "$W/public.json" | sed -n '/Public signals Hex encoding:/{n;p;}' | tr -d '[:space:]' | sed 's/^0x//')"

log "withdraw coin A -> $RECIP (verifies proof on-chain; root must match incremental tree)"
stellar contract invoke --id "$CID" --source veil_rtest --network "$NETWORK" -- withdraw --to "$RECIP" --proof_bytes "$PROOF_HEX" --pub_signals_bytes "$PUBLIC_HEX"
log "✅ multi-deposit + withdraw verified — incremental tree fix works end-to-end"