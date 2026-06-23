# Veil — BUIDL Submission

Copy-paste content for the hackathon submission form. Fields are grouped to match the
editor tabs: **Profile · Details · Team · Contact · Submission**.

---

## PROFILE

**Name**
```
Veil
```

**Tagline / short description** (one line)
```
Private stablecoin pools on Stellar — deposit and withdraw with no on-chain link between the two accounts, enforced by Groth16 zero-knowledge proofs verified inside a Soroban smart contract.
```

**Category / track**
```
Stellar Hacks: Real-World ZK — Privacy / DeFi / Compliance
```

**Logo / icon**
```
◈  (purple diamond mark; accent #7C5CFF on dark #0B0D12)
```

---

## DETAILS

**What is Veil?**

Veil is a multi-denomination shielded pool for Stellar. You deposit a fixed amount of a
token from one account and later withdraw the same amount to a completely unrelated
account. On the public ledger there is no cryptographic link between the two — the pool
only releases funds because a zero-knowledge proof, verified inside a Soroban smart
contract, says you are entitled to them.

The zero-knowledge is load-bearing: remove it and the contract has no way to know the
withdrawer owns a deposit without being told *which* deposit — which is exactly the link
Veil hides.

**The problem**

Every Stellar payment is public and permanently linkable. Payroll, treasury moves,
donations, and ordinary stablecoin transfers all expose counterparties, balances, and
timing to anyone with a block explorer. "Privacy" tools that simply move funds through a
mixer give you anonymity but no way to satisfy compliance — so they are unusable for
real-world money.

**The solution**

Veil is a Privacy Pool, not a blind mixer. Withdrawals are unlinkable to deposits, but
each coin must prove membership in an **Association Set** published by the pool's
Association Set Provider (ASP). That gives privacy *with* a compliance hook: honest users
get unlinkability, while funds from excluded sources can be kept out of the set. It is
the "privacy that regulators can live with" design, implemented end to end on Stellar.

**How the zero-knowledge works**

The withdrawal circuit (Circom, Groth16 over BLS12-381) proves, in zero knowledge, that:

1. **You own a commitment in the pool.** `commitment = Poseidon(value, label, Poseidon(nullifier, secret))` is a leaf of the pool's Merkle tree at a recent root. You reveal the root, not the leaf.
2. **You haven't spent it before.** The circuit outputs `nullifierHash = Poseidon(nullifier)`; the contract records used nullifiers, so each coin withdraws exactly once (double-spend protection).
3. **You're withdrawing a valid amount.** It range-proves `withdrawnValue <= value`, and Veil's contract pins `withdrawnValue == denom`, making each pool a sound fixed-denomination anonymity set.
4. **You satisfy the compliance policy.** It proves your coin's `label` is in the ASP's published Association Set.

Verification runs **on-chain** using Stellar's Protocol 25 host functions: BLS12-381 curve
operations (`pairing_check`, `g1_*`) and native Poseidon hashing. That is what makes the
Merkle tree and the Groth16 pairing check cheap enough to run inside a Soroban contract.

**What we built (this hackathon)**

Veil builds on the `ymcrcat/soroban-privacy-pools` research prototype (single hardcoded
1-XLM pool). We turned it into a usable multi-pool application:

- **Multi-denomination pools** — the contract is parameterized by denomination and enforces `withdrawnValue == denom`, so one codebase serves 1 / 10 / 100 / 1000 XLM pools as independent anonymity sets.
- **Scalable deposits** — replaced the per-deposit full-tree rebuild (which blew Soroban's CPU budget on the *second* deposit) with a frontier-based incremental Merkle insert (Tornado `MerkleTreeWithHistory`): every deposit is O(depth) regardless of pool size. Verified on testnet with multi-deposit + withdraw.
- **30-root history window** — a proof verifies against any recent root, so deposits landing between proving and submission no longer invalidate a withdrawal.
- **Prover + ASP coordinator service** (`services/relayer`) that generates withdrawal proofs (snarkjs) and maintains association sets on-chain.
- **A polished React + Vite + Freighter dapp** (`app/`) — dashboard, per-pool on-chain detail, deposit → secret-note → withdraw flow, local note vault, and a one-click in-browser **demo mode** that runs the entire flow with no backend.
- **One-command multi-pool deploy** (`scripts/deploy-pools.sh`) and a headless end-to-end script (`demo.sh`, `scripts/e2e-multi.sh`).

**Architecture**

```
Web dapp (Freighter) ──deposit(commitment)──►  PrivacyPools x N  (one Soroban
                     ◄─withdraw(proof,signals)  contract per denomination)
        │                                       - Lean IMT (Poseidon)
        │ note / proof requests                 - Groth16 verify (BLS12-381)
        ▼                                        - nullifier set + 30-root history
Relayer / ASP coordinator                        - association root
(services/relayer)  ── proof gen + set_root(admin)
```

**Tech stack**

Soroban (Rust, `wasm32v1-none`) · Protocol 25 BLS12-381 + Poseidon host functions ·
Circom + Groth16 + snarkjs · Lean Incremental Merkle Tree · Node/TypeScript relayer ·
React + Vite + `@stellar/stellar-sdk` + Freighter · deployed on Vercel.

**Honest status**

Testnet prototype, not audited. Poseidon impl is a PoC (inherited upstream); Groth16
trusted setup is currently single-contributor; recipient binding for a fee-paying relayer
is on the roadmap. Do not use with real funds. Full disclosure in the README.

---

## TEAM

```
caelum0x (Arhan Subasi) — protocol, contracts, ZK integration, frontend
GitHub: https://github.com/caelum0x
```
*(Add any additional teammates here: name — role — GitHub/handle.)*

---

## CONTACT

```
Email:   subasiarhan3@gmail.com
GitHub:  https://github.com/caelum0x
Repo:    https://github.com/caelum0x/veil
```

---

## SUBMISSION

**GitHub repository**
```
https://github.com/caelum0x/veil
```

**Live demo (runs in-browser, no wallet/setup required)**
```
https://stellar-zk.vercel.app
```

**Demo video (50s walkthrough)**
```
https://github.com/caelum0x/veil/blob/main/docs/veil-demo.mp4
Direct MP4:  https://stellar-zk.vercel.app/veil-demo.mp4
```

**How to try it in 20 seconds**
1. Open https://stellar-zk.vercel.app
2. Click **Connect** (demo wallet), go to **Deposit**, pick a denomination, click **Deposit** → you receive a secret **note**.
3. Go to **Withdraw**, paste the note, set any recipient, click **Withdraw** → a Groth16 proof is generated and "verified on-chain"; funds release with no link to the deposit.
4. Toggle demo mode off in **Settings** to point the dapp at a real relayer/indexer/RPC.

**Built on:** `ymcrcat/soroban-privacy-pools` (license preserved). **For:** Stellar Hacks: Real-World ZK.
