# Veil — private stablecoin pools on Stellar

Veil is a **multi-denomination shielded pool** for Stellar. You deposit a fixed
amount of a token from one account and later withdraw the same amount to a
completely unrelated account. On the public ledger there is **no cryptographic
link** between the two — the pool only releases funds because a zero-knowledge
proof, verified inside a Soroban smart contract, says you are entitled to them.

The zero-knowledge is load-bearing: remove it and the contract has no way to know
the withdrawer owns a deposit without being told *which* deposit — which is exactly
the link Veil hides.

Built for **Stellar Hacks: Real-World ZK**.

> **Status: testnet prototype, not audited.** See [Trust assumptions &
> limitations](#trust-assumptions--limitations). Do not use with real funds.

---

## Built on prior work

Veil builds directly on [`ymcrcat/soroban-privacy-pools`](https://github.com/ymcrcat/soroban-privacy-pools),
a research prototype of the Privacy Pools design (commitments + Lean Incremental
Merkle Tree + Association Set Providers) for Soroban. We kept its circuits, Poseidon
implementation, Groth16 verifier (BLS12-381 host functions), and CLI tooling, and
added the pieces needed to turn it into a usable multi-pool application:

- **Multi-denomination pools** — the contract is parameterized by a denomination and
  enforces `withdrawnValue == denom`, so one codebase serves 1 / 10 / 100 / 1000 XLM
  pools as independent anonymity sets (upstream was a single hardcoded 1-XLM pool).
- **A prover + ASP coordinator service** (`services/relayer`) that generates
  withdrawal proofs and maintains association sets on-chain.
- **A web dapp** (`app/`) with Freighter wallet integration for deposit/withdraw.
- **A one-command multi-pool deploy** (`scripts/deploy-pools.sh`).

Upstream's license is preserved in `LICENSE`; its original README is at
`docs/UPSTREAM_README.md`.

---

## How the ZK works

The withdrawal circuit (`circuits/main.circom`, Groth16 over BLS12-381) proves, in
zero knowledge, that:

1. **You own a commitment in the pool.** `commitment = Poseidon(value, label,
   Poseidon(nullifier, secret))` is a leaf of the pool's Merkle tree at the current
   root. You reveal the root, not the leaf.
2. **You haven't spent it before.** The circuit outputs `nullifierHash =
   Poseidon(nullifier)`. The contract records used nullifiers, so a coin can be
   withdrawn exactly once (double-spend protection).
3. **You're withdrawing a valid amount.** It range-proves `withdrawnValue <= value`.
   Veil's contract additionally pins `withdrawnValue == denom`, making each pool a
   sound fixed-denomination set.
4. **You satisfy the compliance policy.** It proves your coin's `label` is in the
   Association Set published by the pool's ASP — privacy *with* a compliance hook,
   rather than unconditional anonymity.

Verification runs on-chain using Stellar's **Protocol 25 host functions**: BLS12-381
curve operations (`pairing_check`, `g1_*`) and native Poseidon hashing. That is what
makes the Merkle tree and the Groth16 pairing check cheap enough to run inside a
Soroban contract.

---

## Architecture

```
┌────────────┐   deposit(commitment)        ┌──────────────────────┐
│  Web dapp  │ ───────────────────────────► │  PrivacyPools (x N)  │   one Soroban
│ (Freighter)│   withdraw(proof, signals)   │  Soroban contracts   │   contract per
└─────┬──────┘ ◄─────────────────────────── │  - Lean IMT (Poseidon)│   denomination
      │                                      │  - Groth16 verify     │
      │ note / proof requests                │  - nullifier set      │
      ▼                                      │  - association root    │
┌───────────────────────────┐               └──────────────────────┘
│ Relayer / ASP coordinator  │  proof gen (snarkjs) + association sets + set_root(admin)
│      services/relayer       │  shells out to: coinutils, circom2soroban, snarkjs
└───────────────────────────┘
```

| Path | What it is |
|------|------------|
| `circuits/` | Circom circuits (`main`, `commitment`, `merkleProof`, Poseidon255) |
| `contract/` | `PrivacyPools` Soroban contract (multi-denomination) |
| `libs/zk` | Groth16 verifier using BLS12-381 host functions |
| `libs/lean-imt` | Lean Incremental Merkle Tree (Poseidon) |
| `cli/coinutils` | Coin generation + withdrawal-input builder (`--value` per denom) |
| `cli/circom2soroban` | Converts snarkjs VK/proof/signals to Soroban hex |
| `services/relayer` | Prover + ASP coordinator (Node/TypeScript) |
| `app/` | React + Vite + Freighter dapp |
| `scripts/deploy-pools.sh` | Deploys all denominations, writes `deployments/<net>.json` |

---

## Quick start (testnet)

Prerequisites: Rust + `wasm32v1-none` target, `stellar` CLI, `circom`, `snarkjs`,
Node 20+, `jq`.

```bash
# 1. Compile circuits
make .circuits CIRCOMLIB="$(npm root -g)/circomlib/circuits"

# 2. Trusted setup (BLS12-381 Powers of Tau + phase2 + per-circuit key)
#    See "Trusted setup" below. Produces circuits/output/main_final.zkey + VK.

# 3. Deploy all denomination pools to testnet (writes deployments/testnet.json)
scripts/deploy-pools.sh testnet veil_admin

# 4. Run the prover / ASP coordinator
cd services/relayer && npm install && npm start      # http://localhost:8787

# 5. Run the dapp
cd app && npm install && npm run dev                 # http://localhost:5173
```

### Trusted setup

```bash
cd circuits && mkdir -p output
snarkjs powersoftau new bls12-381 15 output/pot15_0000.ptau -v
snarkjs powersoftau contribute output/pot15_0000.ptau output/pot15_0001.ptau -e="$(openssl rand -hex 32)"
snarkjs powersoftau prepare phase2 output/pot15_0001.ptau output/pot15_final.ptau -v   # slow for BLS12-381
snarkjs groth16 setup build/main.r1cs output/pot15_final.ptau output/main_0000.zkey
snarkjs zkey contribute output/main_0000.zkey output/main_final.zkey -e="$(openssl rand -hex 32)"
snarkjs zkey export verificationkey output/main_final.zkey output/main_verification_key.json
```

---

## End-to-end flow

1. **Deposit.** The dapp asks the coordinator to mint a coin (commitment + secret
   note) for the chosen denomination, then calls `deposit(from, commitment)` via
   Freighter. The coordinator records the commitment and publishes the updated
   association root. You download your **note** — the only way to withdraw.
2. **Withdraw.** Paste the note, choose a recipient, and the coordinator generates a
   Groth16 proof against the current pool state. The dapp calls `withdraw(to,
   proof, signals)`; the contract verifies the proof, checks the nullifier and
   roots, and releases the denomination to the recipient.

A headless end-to-end run for a single pool is in `demo.sh`.

---

## Trust assumptions & limitations

Honest disclosure (this is a hackathon prototype):

- **Not audited.** The Poseidon implementation in particular is a PoC, inherited from
  upstream, and is explicitly not a reference-grade implementation.
- **Trusted setup.** Groth16 needs a trusted setup; the testnet keys here come from a
  single-contributor ceremony. A real deployment needs a proper multi-party ceremony.
- **Withdrawal fee / recipient binding.** The recipient currently signs and pays the
  (tiny) withdrawal fee. A fee-paying relayer that submits on the recipient's behalf
  requires binding the recipient into the proof (a circuit change); this is on the
  roadmap and would also let a brand-new, unfunded account receive privately.
- **Self-issued test token by default.** Pools use the XLM SAC on testnet for the demo.

### Resolved

- **Root history.** The contract keeps a 30-root history window
  (`contract/src/root_history.rs`); a withdrawal proof verifies against any recent
  root, so deposits landing between proving and submission no longer invalidate it.
- **Deposit scalability.** The Merkle tree uses a frontier-based incremental insert
  (`libs/lean-imt/src/incremental.rs`, the Tornado `MerkleTreeWithHistory` algorithm):
  every deposit costs O(depth) hashes regardless of how full the pool is. The earlier
  implementation rebuilt the whole tree per deposit and hit Soroban's CPU budget on the
  2nd deposit; pools now scale to a full anonymity set. Verified on testnet with
  multi-deposit + withdraw (`scripts/e2e-multi.sh`).

---

## License

See `LICENSE`. Built on `ymcrcat/soroban-privacy-pools`.
# veil
