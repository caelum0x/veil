//! Frontier-based incremental fixed-depth Merkle tree.
//!
//! This is the on-chain insert path. The original `LeanIMT` recomputes the tree from
//! the full leaf set on every `from_storage`, which costs O(2^depth) Poseidon hashes
//! once the cache is dropped — blowing Soroban's CPU budget on the 2nd+ deposit.
//!
//! This implementation keeps only the right-most frontier (`filled_subtrees`, one node
//! per level) plus the precomputed empty-subtree hashes (`zeros`). Inserting a leaf
//! touches exactly one node per level — O(depth) hashes, O(depth) storage — using the
//! standard Tornado `MerkleTreeWithHistory` algorithm.
//!
//! Crucially it produces the **same root** as `LeanIMT` for the same leaves (both are
//! fixed-depth, zero-padded, Poseidon(left,right) trees), so off-chain proofs built
//! against `LeanIMT` still verify against roots produced here.

use soroban_poseidon::poseidon_hash;
use soroban_sdk::{crypto::bls12_381::Fr as BlsScalar, vec, BytesN, Env, Vec};

fn zero_bytes(env: &Env) -> BytesN<32> {
    BytesN::from_array(env, &[0u8; 32])
}

/// Poseidon hash of two nodes — identical to `LeanIMT::hash_pair` so roots match.
pub fn hash_pair(env: &Env, left: &BytesN<32>, right: &BytesN<32>) -> BytesN<32> {
    let l = BlsScalar::from_bytes(left.clone()).to_u256();
    let r = BlsScalar::from_bytes(right.clone()).to_u256();
    let inputs = Vec::from_array(env, [l, r]);
    let result = poseidon_hash::<3, BlsScalar>(env, &inputs);
    BlsScalar::from_u256(result).to_bytes()
}

pub struct IncrementalMerkleTree {
    env: Env,
    depth: u32,
    next_index: u32,
    /// One cached left-subtree node per level (the "frontier").
    filled_subtrees: Vec<BytesN<32>>,
    /// Empty-subtree hash per level: zeros[0]=0, zeros[i]=hash(zeros[i-1], zeros[i-1]).
    zeros: Vec<BytesN<32>>,
    root: BytesN<32>,
}

impl IncrementalMerkleTree {
    fn compute_zeros(env: &Env, depth: u32) -> Vec<BytesN<32>> {
        let mut zeros = vec![env];
        let mut cur = zero_bytes(env);
        zeros.push_back(cur.clone());
        let mut i = 0;
        while i < depth {
            cur = hash_pair(env, &cur, &cur);
            zeros.push_back(cur.clone());
            i += 1;
        }
        zeros // length depth + 1
    }

    fn capacity(depth: u32) -> u32 {
        1u32.checked_shl(depth).unwrap_or(u32::MAX)
    }

    /// A fresh empty tree of the given depth.
    pub fn new(env: &Env, depth: u32) -> Self {
        let zeros = Self::compute_zeros(env, depth);
        let mut filled = vec![env];
        let mut i = 0;
        while i < depth {
            filled.push_back(zeros.get(i).unwrap());
            i += 1;
        }
        let root = zeros.get(depth).unwrap();
        Self {
            env: env.clone(),
            depth,
            next_index: 0,
            filled_subtrees: filled,
            zeros,
            root,
        }
    }

    /// Append a leaf. Returns its index. O(depth) hashes.
    pub fn insert(&mut self, leaf: BytesN<32>) -> Result<u32, &'static str> {
        if self.next_index >= Self::capacity(self.depth) {
            return Err("Tree is at capacity: cannot insert more leaves");
        }
        let leaf_index = self.next_index;
        let mut idx = self.next_index;
        let mut cur = leaf;
        let mut level = 0u32;
        while level < self.depth {
            let left;
            let right;
            if idx % 2 == 0 {
                left = cur.clone();
                right = self.zeros.get(level).unwrap();
                self.filled_subtrees.set(level, cur.clone());
            } else {
                left = self.filled_subtrees.get(level).unwrap();
                right = cur.clone();
            }
            cur = hash_pair(&self.env, &left, &right);
            idx /= 2;
            level += 1;
        }
        self.root = cur;
        self.next_index += 1;
        Ok(leaf_index)
    }

    pub fn root(&self) -> BytesN<32> {
        self.root.clone()
    }

    pub fn count(&self) -> u32 {
        self.next_index
    }

    pub fn depth(&self) -> u32 {
        self.depth
    }

    pub fn is_full(&self) -> bool {
        self.next_index >= Self::capacity(self.depth)
    }

    /// Persisted state: (frontier, next_index, root). Depth is a constant supplied at load.
    pub fn to_storage(&self) -> (Vec<BytesN<32>>, u32, BytesN<32>) {
        (self.filled_subtrees.clone(), self.next_index, self.root.clone())
    }

    /// Rehydrate from persisted state. Recomputes `zeros` (O(depth), cheap).
    pub fn from_storage(
        env: &Env,
        depth: u32,
        filled_subtrees: Vec<BytesN<32>>,
        next_index: u32,
        root: BytesN<32>,
    ) -> Self {
        let zeros = Self::compute_zeros(env, depth);
        Self {
            env: env.clone(),
            depth,
            next_index,
            filled_subtrees,
            zeros,
            root,
        }
    }
}
