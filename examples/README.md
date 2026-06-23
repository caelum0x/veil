# Veil SDK examples

Runnable scripts demonstrating `@veil/sdk`. They expect a running relayer
(`:8787`) and indexer (`:8789`) and a deployed `deployments/testnet.json`.

```bash
# read-only (safe to run anytime)
npx tsx src/list-pools.ts        # list pools + contract ids
npx tsx src/health.ts            # relayer + indexer reachability
npx tsx src/pool-stats.ts        # anonymity-set sizes, withdrawals, locked value

# flows (the SDK prepares; you submit the Stellar tx with a wallet)
npx tsx src/deposit-flow.ts 1000000000
npx tsx src/withdraw-flow.ts 1000000000 G...RECIPIENT note.json
```

The SDK never signs transactions. `deposit-flow` prints the commitment to submit
and the secret note to keep; `withdraw-flow` generates the Groth16 proof to submit.
Signing/submitting is done by your wallet (e.g. Freighter in the dapp, or the
`stellar` CLI).
