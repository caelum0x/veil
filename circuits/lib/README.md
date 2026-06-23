# circuits/lib

Off-chain TypeScript helpers for working with the Veil circuits — field arithmetic,
Merkle index math, signal formatting, and `main.circom` input builders. Pure
functions, no build step required to read or reuse.

| Module | What it provides |
|--------|------------------|
| `field.ts` | BLS12-381 `Fr` arithmetic over `BigInt` (`add`/`mul`/`inv`/`pow`, byte ↔ field, hex/decimal). |
| `merkle.ts` | Tree index math: parent/child/sibling, path indices, sibling paths, leaf padding. |
| `format.ts` | Conversions between decimal / hex / bytes representations of signals. |
| `inputs.ts` | Builders + validators for the Withdraw circuit input JSON. |
| `validate.ts` | Field-membership, range, and reduction checks for witnesses. |
| `signals.ts` | Typed access to the public-signal vector `[nullifierHash, withdrawnValue, stateRoot, associationRoot]`. |

These mirror, in JS, the encodings the Rust tooling (`coinutils`, `circom2soroban`)
and the contract use, so they are handy for debugging proofs and building inputs in a
browser or Node context.
