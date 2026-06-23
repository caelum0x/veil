//! Integer <-> byte conversions in both endiannesses.

/// u32 to 4 big-endian bytes.
pub fn u32_be(v: u32) -> [u8; 4] {
    v.to_be_bytes()
}
/// u32 to 4 little-endian bytes.
pub fn u32_le(v: u32) -> [u8; 4] {
    v.to_le_bytes()
}
/// 4 big-endian bytes to u32.
pub fn be_u32(b: [u8; 4]) -> u32 {
    u32::from_be_bytes(b)
}
/// 4 little-endian bytes to u32.
pub fn le_u32(b: [u8; 4]) -> u32 {
    u32::from_le_bytes(b)
}
/// u64 to 8 big-endian bytes.
pub fn u64_be(v: u64) -> [u8; 8] {
    v.to_be_bytes()
}
/// u64 to 8 little-endian bytes.
pub fn u64_le(v: u64) -> [u8; 8] {
    v.to_le_bytes()
}
/// 8 big-endian bytes to u64.
pub fn be_u64(b: [u8; 8]) -> u64 {
    u64::from_be_bytes(b)
}
/// 8 little-endian bytes to u64.
pub fn le_u64(b: [u8; 8]) -> u64 {
    u64::from_le_bytes(b)
}
/// u128 to 16 big-endian bytes.
pub fn u128_be(v: u128) -> [u8; 16] {
    v.to_be_bytes()
}
/// u128 to 16 little-endian bytes.
pub fn u128_le(v: u128) -> [u8; 16] {
    v.to_le_bytes()
}
/// 16 big-endian bytes to u128.
pub fn be_u128(b: [u8; 16]) -> u128 {
    u128::from_be_bytes(b)
}
/// 16 little-endian bytes to u128.
pub fn le_u128(b: [u8; 16]) -> u128 {
    u128::from_le_bytes(b)
}
/// i128 to 16 big-endian bytes.
pub fn i128_be(v: i128) -> [u8; 16] {
    v.to_be_bytes()
}
/// 16 big-endian bytes to i128.
pub fn be_i128(b: [u8; 16]) -> i128 {
    i128::from_be_bytes(b)
}
/// Read a big-endian u64 from the front of a slice (0-padded if short).
pub fn read_be_u64(b: &[u8]) -> u64 {
    let mut a = [0u8; 8];
    let n = b.len().min(8);
    a[8 - n..].copy_from_slice(&b[..n]);
    u64::from_be_bytes(a)
}
/// Swap endianness of a 32-byte array.
pub fn swap32(mut b: [u8; 32]) -> [u8; 32] {
    b.reverse();
    b
}
