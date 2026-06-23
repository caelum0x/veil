//! Pure `no_std` bit-manipulation helpers.

/// Set bit `i` in a u64.
pub fn set(v: u64, i: u32) -> u64 {
    v | (1u64 << i)
}

/// Clear bit `i`.
pub fn clear(v: u64, i: u32) -> u64 {
    v & !(1u64 << i)
}

/// Toggle bit `i`.
pub fn toggle(v: u64, i: u32) -> u64 {
    v ^ (1u64 << i)
}

/// Read bit `i`.
pub fn get(v: u64, i: u32) -> bool {
    (v >> i) & 1 == 1
}

/// Count set bits.
pub fn popcount(v: u64) -> u32 {
    v.count_ones()
}

/// Count leading zeros.
pub fn leading_zeros(v: u64) -> u32 {
    v.leading_zeros()
}

/// Count trailing zeros.
pub fn trailing_zeros(v: u64) -> u32 {
    v.trailing_zeros()
}

/// Lowest set bit (as a mask), or 0.
pub fn lowest_set(v: u64) -> u64 {
    v & v.wrapping_neg()
}

/// Round up to the next power of two.
pub fn next_pow2(v: u64) -> u64 {
    if v <= 1 {
        1
    } else {
        let n = 64 - (v - 1).leading_zeros();
        1u64 << n
    }
}

/// Whether a value is a power of two.
pub fn is_pow2(v: u64) -> bool {
    v != 0 && (v & (v - 1)) == 0
}

/// Reverse the low `width` bits.
pub fn reverse_low(v: u64, width: u32) -> u64 {
    let mut r = 0u64;
    let mut i = 0;
    while i < width {
        if (v >> i) & 1 == 1 {
            r |= 1u64 << (width - 1 - i);
        }
        i += 1;
    }
    r
}

/// Extract a bit field of `len` bits starting at `start`.
pub fn extract(v: u64, start: u32, len: u32) -> u64 {
    if len >= 64 {
        v >> start
    } else {
        (v >> start) & ((1u64 << len) - 1)
    }
}

/// Mask of the low `n` bits.
pub fn low_mask(n: u32) -> u64 {
    if n >= 64 {
        u64::MAX
    } else {
        (1u64 << n) - 1
    }
}

/// Rotate left.
pub fn rotl(v: u64, n: u32) -> u64 {
    v.rotate_left(n)
}

/// Rotate right.
pub fn rotr(v: u64, n: u32) -> u64 {
    v.rotate_right(n)
}

/// Align `v` up to a multiple of `align` (power of two).
pub fn align_up(v: u64, align: u64) -> u64 {
    if align == 0 {
        v
    } else {
        (v + align - 1) & !(align - 1)
    }
}
