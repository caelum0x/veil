# Veil circuits

The zero-knowledge circuits that make a withdrawal provable without revealing which
deposit it came from. Groth16 over **BLS12-381**, compiled with `circom --prime
bls12381`. The verification key is converted to Soroban form by
`cli/circom2soroban` and embedded in the pool contract at deploy time.

## Files

| File | Role |
|------|------|
| `main.circom` | Top-level `Withdraw` circuit. Public: `withdrawnValue`, `stateRoot`, `associationRoot`; output: `nullifierHash`. |
| `commitment.circom` | `CommitmentHasher`: `commitment = Poseidon(value, label, Poseidon(nullifier, secret))`, `nullifierHash = Poseidon(nullifier)`. |
| `merkleProof.circom` | Merkle inclusion proof against a root, used for both the state tree and the association tree. |
| `poseidon255.circom`, `poseidon255_constants.circom` | Poseidon over the BLS12-381 scalar field, kept byte-for-byte consistent with the Rust implementation in `libs` / `cli/coinutils`. |
| `dummy.circom` | Minimal circuit used in tooling/setup smoke checks. |
| `test/` | Standalone test circuits + Rust harnesses asserting circom↔Rust Poseidon and Merkle agreement. |

## What `main.circom` proves

Given private witnesses (`value`, `label`, `nullifier`, `secret`, Merkle paths) and
public inputs (`withdrawnValue`, `stateRoot`, `associationRoot`), the circuit enforces:

1. `commitment = Poseidon(value, label, Poseidon(nullifier, secret))`.
2. `commitment` is a leaf of the state tree at `stateRoot` (Merkle inclusion).
3. `label` is a leaf of the association tree at `associationRoot` — or
   `associationRoot == 0`, which disables the check (the constraint
   `associationRoot * (associationRoot - computed) === 0`).
4. `0 <= withdrawnValue <= value` via 128-bit range checks.
5. Output `nullifierHash = Poseidon(nullifier)` (public, recorded on-chain to prevent
   double-spends).

The contract additionally pins `withdrawnValue == pool denomination`, which is what
makes each fixed-denomination pool sound (see `contract/src/lib.rs`).

## Public signal order

snarkjs emits public signals as `[outputs..., publicInputs...]`, so the contract reads:

```
[ nullifierHash, withdrawnValue, stateRoot, associationRoot ]
```

## Build & setup

See the repo `README.md` (Quick start → "Trusted setup"). The depth constants are
`treeDepth = 20` (state) and `associationDepth = 2` (association) in
`component main = Withdraw(20, 2)`; changing them requires recompiling **and** a new
trusted setup.

> ⚠️ Changing any circuit invalidates the existing `circuits/output/*.zkey` and the
> verification key already embedded in deployed contracts. Recompile, re-run the
> trusted setup, and redeploy together.
