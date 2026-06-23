//! Bounded Merkle-root history.
//!
//! The pool tree changes on every deposit, but a withdrawal proof is generated
//! against whatever root was current when the prover ran. If another user deposits
//! in between, a contract that only accepts the *latest* root would reject the
//! now-stale (but perfectly valid) proof, forcing a regenerate-and-retry race.
//!
//! Instead we keep a ring buffer of the last `HISTORY_SIZE` roots and accept a proof
//! whose root appears anywhere in it. This is the same approach Tornado Cash uses
//! (`ROOT_HISTORY_SIZE = 30`). It does not weaken soundness: every historical root
//! still corresponds to a real tree state the user could prove membership in, and the
//! nullifier set still prevents double-spends.

use soroban_sdk::{symbol_short, vec, BytesN, Env, Symbol, Vec};

const HISTORY_KEY: Symbol = symbol_short!("roothist");

/// Number of recent roots accepted by `withdraw`. Mirrors Tornado's window.
pub const HISTORY_SIZE: u32 = 30;

fn load(env: &Env) -> Vec<BytesN<32>> {
    env.storage()
        .instance()
        .get(&HISTORY_KEY)
        .unwrap_or(vec![env])
}

/// Append a root, evicting the oldest if the window is full.
pub fn push(env: &Env, root: BytesN<32>) {
    let mut hist = load(env);
    // Avoid storing duplicates back-to-back (e.g. a no-op re-push of the current root).
    if let Some(last) = hist.last() {
        if last == root {
            return;
        }
    }
    hist.push_back(root);
    while hist.len() > HISTORY_SIZE {
        hist.remove(0);
    }
    env.storage().instance().set(&HISTORY_KEY, &hist);
}

/// True if `root` is one of the recent roots (including the current one).
pub fn contains(env: &Env, root: &BytesN<32>) -> bool {
    load(env).iter().any(|r| &r == root)
}

/// The full window, newest last. Exposed as a contract getter for debugging/indexing.
pub fn all(env: &Env) -> Vec<BytesN<32>> {
    load(env)
}
