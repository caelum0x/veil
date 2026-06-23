//! Fixed/variable byte-slice helpers.

/// Bitwise XOR of two equal-length slices (truncates to the shorter).
pub fn xor(a: &[u8], b: &[u8]) -> Vec<u8> {
    a.iter().zip(b).map(|(x, y)| x ^ y).collect()
}

/// Bitwise AND.
pub fn and(a: &[u8], b: &[u8]) -> Vec<u8> {
    a.iter().zip(b).map(|(x, y)| x & y).collect()
}

/// Bitwise OR.
pub fn or(a: &[u8], b: &[u8]) -> Vec<u8> {
    a.iter().zip(b).map(|(x, y)| x | y).collect()
}

/// Bitwise NOT.
pub fn not(a: &[u8]) -> Vec<u8> {
    a.iter().map(|x| !x).collect()
}

/// Reverse a copy of the slice.
pub fn reversed(a: &[u8]) -> Vec<u8> {
    let mut v = a.to_vec();
    v.reverse();
    v
}

/// True if all bytes are zero.
pub fn is_zero(a: &[u8]) -> bool {
    a.iter().all(|&b| b == 0)
}

/// Constant-time-ish equality (length + content). Not a security primitive.
pub fn eq(a: &[u8], b: &[u8]) -> bool {
    a.len() == b.len() && a.iter().zip(b).all(|(x, y)| x == y)
}

/// Concatenate two slices.
pub fn concat(a: &[u8], b: &[u8]) -> Vec<u8> {
    let mut v = Vec::with_capacity(a.len() + b.len());
    v.extend_from_slice(a);
    v.extend_from_slice(b);
    v
}

/// Left-pad a slice with zero bytes to `width`.
pub fn pad_left(a: &[u8], width: usize) -> Vec<u8> {
    if a.len() >= width {
        a.to_vec()
    } else {
        let mut v = vec![0u8; width - a.len()];
        v.extend_from_slice(a);
        v
    }
}

/// Right-pad a slice with zero bytes to `width`.
pub fn pad_right(a: &[u8], width: usize) -> Vec<u8> {
    let mut v = a.to_vec();
    v.resize(width.max(a.len()), 0);
    v
}

/// Convert a slice into a fixed `[u8; 32]`, left-padding or taking the low 32 bytes.
pub fn to_array32(a: &[u8]) -> [u8; 32] {
    let mut out = [0u8; 32];
    if a.len() >= 32 {
        out.copy_from_slice(&a[a.len() - 32..]);
    } else {
        out[32 - a.len()..].copy_from_slice(a);
    }
    out
}

/// Count leading zero bytes.
pub fn leading_zeros(a: &[u8]) -> usize {
    a.iter().take_while(|&&b| b == 0).count()
}

/// Count trailing zero bytes.
pub fn trailing_zeros(a: &[u8]) -> usize {
    a.iter().rev().take_while(|&&b| b == 0).count()
}

/// Strip leading zero bytes (returns a sub-slice).
pub fn trim_left_zeros(a: &[u8]) -> &[u8] {
    &a[leading_zeros(a).min(a.len())..]
}

/// Split a slice at `mid`, returning two owned halves.
pub fn split_at(a: &[u8], mid: usize) -> (Vec<u8>, Vec<u8>) {
    let m = mid.min(a.len());
    (a[..m].to_vec(), a[m..].to_vec())
}

/// First `n` bytes (owned).
pub fn take(a: &[u8], n: usize) -> Vec<u8> {
    a[..n.min(a.len())].to_vec()
}

/// Last `n` bytes (owned).
pub fn take_last(a: &[u8], n: usize) -> Vec<u8> {
    a[a.len().saturating_sub(n)..].to_vec()
}

/// Chunk a slice into pieces of `size`.
pub fn chunks(a: &[u8], size: usize) -> Vec<Vec<u8>> {
    if size == 0 {
        return vec![];
    }
    a.chunks(size).map(|c| c.to_vec()).collect()
}

/// Repeat a byte `n` times.
pub fn repeat(b: u8, n: usize) -> Vec<u8> {
    vec![b; n]
}

/// Sum of all bytes (wrapping), a cheap checksum.
pub fn checksum8(a: &[u8]) -> u8 {
    a.iter().fold(0u8, |acc, &b| acc.wrapping_add(b))
}

/// Hamming weight (number of set bits).
pub fn popcount(a: &[u8]) -> u32 {
    a.iter().map(|b| b.count_ones()).sum()
}

/// Whether `prefix` is a prefix of `a`.
pub fn starts_with(a: &[u8], prefix: &[u8]) -> bool {
    a.len() >= prefix.len() && &a[..prefix.len()] == prefix
}

/// Index of the first occurrence of `needle`.
pub fn find(a: &[u8], needle: u8) -> Option<usize> {
    a.iter().position(|&b| b == needle)
}

/// Set the byte at `idx` (returns a modified copy).
pub fn with_byte(a: &[u8], idx: usize, value: u8) -> Vec<u8> {
    let mut v = a.to_vec();
    if idx < v.len() {
        v[idx] = value;
    }
    v
}
