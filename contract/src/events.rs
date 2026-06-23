//! Contract event emission.
//!
//! Events are how off-chain components (the indexer, the relayer's state store, block
//! explorers) learn about pool activity without trusting a centralized API. Every
//! state-changing entry point publishes a structured event here.

use soroban_sdk::{symbol_short, Address, BytesN, Env};

/// Emitted when a commitment is deposited into the pool.
/// topics: ("deposit",)  data: (depositor, commitment, leaf_index, new_root)
pub fn deposit(
    env: &Env,
    from: &Address,
    commitment: &BytesN<32>,
    leaf_index: u32,
    new_root: &BytesN<32>,
) {
    env.events().publish(
        (symbol_short!("deposit"),),
        (from.clone(), commitment.clone(), leaf_index, new_root.clone()),
    );
}

/// Emitted on a successful withdrawal.
/// topics: ("withdraw",)  data: (recipient, nullifier_hash, amount)
pub fn withdraw(env: &Env, to: &Address, nullifier_hash: &BytesN<32>, amount: i128) {
    env.events().publish(
        (symbol_short!("withdraw"),),
        (to.clone(), nullifier_hash.clone(), amount),
    );
}

/// Emitted when the admin publishes a new association-set root.
/// topics: ("assocroot",)  data: (root)
pub fn association_root(env: &Env, root: &BytesN<32>) {
    env.events()
        .publish((symbol_short!("assocroot"),), root.clone());
}
