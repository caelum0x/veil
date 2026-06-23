//! Pure `no_std` Merkle-tree index arithmetic (no hashing — see `lean-imt` for that).

/// Index of a node's parent.
pub fn parent(index: u32) -> u32 {
    index / 2
}

/// Index of the left child.
pub fn left_child(index: u32) -> u32 {
    index * 2
}

/// Index of the right child.
pub fn right_child(index: u32) -> u32 {
    index * 2 + 1
}

/// Index of a node's sibling.
pub fn sibling(index: u32) -> u32 {
    if index % 2 == 0 {
        index + 1
    } else {
        index - 1
    }
}

/// True if a node is a left child.
pub fn is_left(index: u32) -> bool {
    index % 2 == 0
}

/// True if a node is a right child.
pub fn is_right(index: u32) -> bool {
    index % 2 == 1
}

/// Depth (level) of a leaf index within a tree of `depth`.
pub fn leaf_level(_depth: u32) -> u32 {
    0
}

/// Number of nodes in a full binary tree of `depth`.
pub fn node_count(depth: u32) -> u64 {
    if depth >= 63 {
        u64::MAX
    } else {
        (1u64 << (depth + 1)) - 1
    }
}

/// Number of leaves in a full tree of `depth`.
pub fn leaf_count(depth: u32) -> u64 {
    if depth >= 64 {
        u64::MAX
    } else {
        1u64 << depth
    }
}

/// The path bits (left/right) for a leaf index, LSB first, into `out`.
/// Returns the number of bits written (= depth).
pub fn path_bits(mut index: u32, depth: u32, out: &mut [bool; 32]) -> u32 {
    let mut i = 0;
    while i < depth && (i as usize) < out.len() {
        out[i as usize] = index % 2 == 1;
        index /= 2;
        i += 1;
    }
    depth
}

/// Whether two leaf indices share the given ancestor level.
pub fn shares_ancestor(a: u32, b: u32, level: u32) -> bool {
    (a >> level) == (b >> level)
}

/// The next power-of-two leaf capacity that holds `count` leaves.
pub fn required_depth(count: u32) -> u32 {
    let mut depth = 0;
    while (1u64 << depth) < count as u64 {
        depth += 1;
    }
    depth
}

/// Root index (always 1 in a 1-based heap layout).
pub fn root_index() -> u32 {
    1
}

/// First leaf index in a 1-based heap of `depth`.
pub fn first_leaf(depth: u32) -> u32 {
    1u32 << depth
}
