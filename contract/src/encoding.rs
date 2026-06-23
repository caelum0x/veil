//! Pure, `no_std` byte/amount encoding helpers used by the contract.
//! Core-only (no `alloc`): everything operates on fixed arrays and integers.

/// Encode a non-negative amount as a 32-byte big-endian field element.
pub fn amount_to_be32(amount: i128) -> [u8; 32] {
    let mut be = [0u8; 32];
    let b = amount.to_be_bytes();
    let mut i = 0;
    while i < 16 {
        be[16 + i] = b[i];
        i += 1;
    }
    be
}

/// Decode the low 16 bytes of a 32-byte big-endian element back to i128.
pub fn be32_to_amount(be: &[u8; 32]) -> i128 {
    let mut b = [0u8; 16];
    let mut i = 0;
    while i < 16 {
        b[i] = be[16 + i];
        i += 1;
    }
    i128::from_be_bytes(b)
}

/// The all-zero 32-byte element.
pub fn zero32() -> [u8; 32] {
    [0u8; 32]
}

/// The 32-byte element representing `1`.
pub fn one32() -> [u8; 32] {
    let mut e = [0u8; 32];
    e[31] = 1;
    e
}

/// True if a 32-byte element is all zero.
pub fn is_zero32(e: &[u8; 32]) -> bool {
    let mut i = 0;
    while i < 32 {
        if e[i] != 0 {
            return false;
        }
        i += 1;
    }
    true
}

/// Constant-shape equality for two 32-byte elements.
pub fn eq32(a: &[u8; 32], b: &[u8; 32]) -> bool {
    let mut i = 0;
    while i < 32 {
        if a[i] != b[i] {
            return false;
        }
        i += 1;
    }
    true
}

/// u32 to big-endian bytes.
pub fn u32_be(v: u32) -> [u8; 4] {
    v.to_be_bytes()
}

/// big-endian bytes to u32.
pub fn be_u32(b: [u8; 4]) -> u32 {
    u32::from_be_bytes(b)
}

/// u64 to big-endian bytes.
pub fn u64_be(v: u64) -> [u8; 8] {
    v.to_be_bytes()
}

/// Reverse a 32-byte element (endianness swap).
pub fn reverse32(mut e: [u8; 32]) -> [u8; 32] {
    let mut i = 0;
    while i < 16 {
        let tmp = e[i];
        e[i] = e[31 - i];
        e[31 - i] = tmp;
        i += 1;
    }
    e
}

/// XOR two 32-byte elements.
pub fn xor32(a: &[u8; 32], b: &[u8; 32]) -> [u8; 32] {
    let mut r = [0u8; 32];
    let mut i = 0;
    while i < 32 {
        r[i] = a[i] ^ b[i];
        i += 1;
    }
    r
}

/// Number of leading zero bytes in a 32-byte element.
pub fn leading_zeros32(e: &[u8; 32]) -> u32 {
    let mut n = 0;
    let mut i = 0;
    while i < 32 && e[i] == 0 {
        n += 1;
        i += 1;
    }
    n
}

/// Place a u32 into the low 4 bytes of a 32-byte element.
pub fn u32_to_be32(v: u32) -> [u8; 32] {
    let mut e = [0u8; 32];
    let b = v.to_be_bytes();
    e[28] = b[0];
    e[29] = b[1];
    e[30] = b[2];
    e[31] = b[3];
    e
}
