//! Pure `no_std` predicate/validation helpers for the contract.

/// True if `v` is strictly positive.
pub fn is_positive(v: i128) -> bool {
    v > 0
}

/// True if `v` is non-negative.
pub fn is_non_negative(v: i128) -> bool {
    v >= 0
}

/// True if `v` is within `[lo, hi]`.
pub fn in_range(v: i128, lo: i128, hi: i128) -> bool {
    v >= lo && v <= hi
}

/// True if `v` fits in a u32 (the boundary that previously caused truncation).
pub fn fits_u32(v: i128) -> bool {
    v >= 0 && v <= u32::MAX as i128
}

/// True if `v` fits in a u64.
pub fn fits_u64(v: i128) -> bool {
    v >= 0 && v <= u64::MAX as i128
}

/// True if `a` equals `b`.
pub fn eq_i128(a: i128, b: i128) -> bool {
    a == b
}

/// True if `value` is a power of two.
pub fn is_pow2(value: u64) -> bool {
    value != 0 && (value & (value - 1)) == 0
}

/// True if `leaf_count` does not exceed a tree of `depth`.
pub fn within_capacity(leaf_count: u32, depth: u32) -> bool {
    if depth >= 32 {
        true
    } else {
        (leaf_count as u64) <= (1u64 << depth)
    }
}

/// Clamp a value to `[lo, hi]`.
pub fn clamp(v: i128, lo: i128, hi: i128) -> i128 {
    if v < lo {
        lo
    } else if v > hi {
        hi
    } else {
        v
    }
}

/// Saturating add of two amounts.
pub fn sat_add(a: i128, b: i128) -> i128 {
    a.saturating_add(b)
}

/// Saturating sub of two amounts.
pub fn sat_sub(a: i128, b: i128) -> i128 {
    a.saturating_sub(b)
}

/// True if `amount` exactly matches `denom`.
pub fn matches_denom(amount: i128, denom: i128) -> bool {
    amount == denom && denom > 0
}

/// True if a withdrawal of `amount` is covered by `balance`.
pub fn has_balance(balance: i128, amount: i128) -> bool {
    balance >= amount
}

/// True if `index` is a valid leaf index for `count` leaves.
pub fn valid_index(index: u32, count: u32) -> bool {
    index < count
}
