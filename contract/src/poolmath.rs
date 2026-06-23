//! Pure `no_std` pool/denomination math.

/// Stroops per whole unit (1 XLM) in this project's convention.
pub const STROOPS_PER_UNIT: i128 = 1_000_000_000;

/// Whole units from stroops (truncating).
pub fn to_units(stroops: i128) -> i128 {
    stroops / STROOPS_PER_UNIT
}

/// Stroops from whole units.
pub fn from_units(units: i128) -> i128 {
    units * STROOPS_PER_UNIT
}

/// Basis-point fee on an amount (rounded down).
pub fn fee_bps(amount: i128, bps: i128) -> i128 {
    amount * bps / 10_000
}

/// Amount after a basis-point fee.
pub fn after_fee_bps(amount: i128, bps: i128) -> i128 {
    amount - fee_bps(amount, bps)
}

/// Percentage (rounded down) of `part` over `whole`.
pub fn percent(part: i128, whole: i128) -> i128 {
    if whole == 0 {
        0
    } else {
        part * 100 / whole
    }
}

/// Capacity (max leaves) of a tree of `depth`, capped at u64::MAX.
pub fn capacity(depth: u32) -> u64 {
    if depth >= 64 {
        u64::MAX
    } else {
        1u64 << depth
    }
}

/// Remaining free leaves in a tree.
pub fn remaining_leaves(count: u32, depth: u32) -> u64 {
    capacity(depth).saturating_sub(count as u64)
}

/// Fill fraction (0..=10000 basis points) of a tree.
pub fn fill_bps(count: u32, depth: u32) -> u64 {
    let cap = capacity(depth);
    if cap == 0 {
        0
    } else {
        (count as u64).saturating_mul(10_000) / cap
    }
}

/// Total pool value implied by `count` deposits of `denom`.
pub fn total_value(count: u32, denom: i128) -> i128 {
    (count as i128).saturating_mul(denom)
}

/// Minimum of two amounts.
pub fn min(a: i128, b: i128) -> i128 {
    if a < b {
        a
    } else {
        b
    }
}

/// Maximum of two amounts.
pub fn max(a: i128, b: i128) -> i128 {
    if a > b {
        a
    } else {
        b
    }
}

/// Ceil division for non-negative integers.
pub fn ceil_div(a: i128, b: i128) -> i128 {
    if b == 0 {
        0
    } else {
        (a + b - 1) / b
    }
}

/// log2 floor of a u64 (0 for 0).
pub fn log2_floor(mut v: u64) -> u32 {
    let mut n = 0;
    while v > 1 {
        v >>= 1;
        n += 1;
    }
    n
}
