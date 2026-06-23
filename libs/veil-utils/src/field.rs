//! 32-byte field-element helpers (big-endian representation, as used for BLS12-381
//! / circom public signals). These operate on raw bytes — they do NOT perform modular
//! reduction, so callers must pass already-reduced values.

/// A 32-byte big-endian field element representation.
pub type Fe = [u8; 32];

/// The all-zero element.
pub fn zero() -> Fe {
    [0u8; 32]
}

/// The element `1`.
pub fn one() -> Fe {
    let mut e = [0u8; 32];
    e[31] = 1;
    e
}

/// Build an element from a small u128 (big-endian, low 16 bytes).
pub fn from_u128(v: u128) -> Fe {
    let mut e = [0u8; 32];
    e[16..].copy_from_slice(&v.to_be_bytes());
    e
}

/// Build an element from an i128 amount (non-negative expected).
pub fn from_i128(v: i128) -> Fe {
    let mut e = [0u8; 32];
    e[16..].copy_from_slice(&v.to_be_bytes());
    e
}

/// Interpret the low 16 bytes as a u128 (ignores the high half).
pub fn low_u128(e: &Fe) -> u128 {
    let mut b = [0u8; 16];
    b.copy_from_slice(&e[16..]);
    u128::from_be_bytes(b)
}

/// True if the element is zero.
pub fn is_zero(e: &Fe) -> bool {
    e.iter().all(|&b| b == 0)
}

/// True if the element is one.
pub fn is_one(e: &Fe) -> bool {
    e[..31].iter().all(|&b| b == 0) && e[31] == 1
}

/// Equality.
pub fn eq(a: &Fe, b: &Fe) -> bool {
    a == b
}

/// Whether the top 16 bytes are all zero (fits in a u128).
pub fn fits_u128(e: &Fe) -> bool {
    e[..16].iter().all(|&b| b == 0)
}

/// Number of significant (non-leading-zero) bytes.
pub fn significant_bytes(e: &Fe) -> usize {
    32 - e.iter().take_while(|&&b| b == 0).count()
}

/// Big-endian byte at logical position (0 = most significant).
pub fn byte_at(e: &Fe, i: usize) -> u8 {
    if i < 32 {
        e[i]
    } else {
        0
    }
}

/// Reverse to little-endian byte order.
pub fn to_le(e: &Fe) -> Fe {
    let mut r = *e;
    r.reverse();
    r
}

/// Construct from a slice, left-padding or taking the low 32 bytes.
pub fn from_slice(b: &[u8]) -> Fe {
    let mut e = [0u8; 32];
    if b.len() >= 32 {
        e.copy_from_slice(&b[b.len() - 32..]);
    } else {
        e[32 - b.len()..].copy_from_slice(b);
    }
    e
}

/// XOR two elements (byte-wise; not a field operation, useful for mixing/tests).
pub fn xor(a: &Fe, b: &Fe) -> Fe {
    let mut r = [0u8; 32];
    for i in 0..32 {
        r[i] = a[i] ^ b[i];
    }
    r
}

/// Lexicographic comparison as big-endian integers.
pub fn cmp(a: &Fe, b: &Fe) -> core::cmp::Ordering {
    a.cmp(b)
}
