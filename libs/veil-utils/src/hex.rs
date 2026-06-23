//! Hex-string helpers (lowercase, no external deps).

/// Lowercase hex of a byte slice.
pub fn encode(bytes: &[u8]) -> String {
    let mut s = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        s.push(nibble_to_hex(b >> 4));
        s.push(nibble_to_hex(b & 0x0f));
    }
    s
}

/// Hex with a `0x` prefix.
pub fn encode_0x(bytes: &[u8]) -> String {
    let mut s = String::with_capacity(bytes.len() * 2 + 2);
    s.push_str("0x");
    s.push_str(&encode(bytes));
    s
}

/// Decode a hex string (with or without `0x`) into bytes. `None` on bad input.
pub fn decode(s: &str) -> Option<Vec<u8>> {
    let s = strip_0x(s);
    if s.len() % 2 != 0 {
        return None;
    }
    let bytes = s.as_bytes();
    let mut out = Vec::with_capacity(s.len() / 2);
    let mut i = 0;
    while i < bytes.len() {
        let hi = hex_to_nibble(bytes[i])?;
        let lo = hex_to_nibble(bytes[i + 1])?;
        out.push((hi << 4) | lo);
        i += 2;
    }
    Some(out)
}

/// Map a low nibble (0..=15) to a hex char.
pub fn nibble_to_hex(n: u8) -> char {
    match n & 0x0f {
        0..=9 => (b'0' + (n & 0x0f)) as char,
        _ => (b'a' + (n & 0x0f) - 10) as char,
    }
}

/// Map a hex ascii byte to its nibble value.
pub fn hex_to_nibble(c: u8) -> Option<u8> {
    match c {
        b'0'..=b'9' => Some(c - b'0'),
        b'a'..=b'f' => Some(c - b'a' + 10),
        b'A'..=b'F' => Some(c - b'A' + 10),
        _ => None,
    }
}

/// Remove a leading `0x`/`0X` if present.
pub fn strip_0x(s: &str) -> &str {
    s.strip_prefix("0x").or_else(|| s.strip_prefix("0X")).unwrap_or(s)
}

/// Ensure a `0x` prefix.
pub fn ensure_0x(s: &str) -> String {
    if s.starts_with("0x") || s.starts_with("0X") {
        s.to_string()
    } else {
        format!("0x{s}")
    }
}

/// True if every char is a hex digit (ignoring an optional `0x`).
pub fn is_hex(s: &str) -> bool {
    let s = strip_0x(s);
    !s.is_empty() && s.bytes().all(|c| hex_to_nibble(c).is_some())
}

/// Left-pad a hex string (no prefix) to `width` chars with zeros.
pub fn pad_left(s: &str, width: usize) -> String {
    let s = strip_0x(s);
    if s.len() >= width {
        s.to_string()
    } else {
        format!("{:0>width$}", s, width = width)
    }
}

/// Pad/truncate a hex string to exactly 64 chars (32 bytes).
pub fn to_hex32(s: &str) -> String {
    let s = strip_0x(s);
    if s.len() >= 64 {
        s[s.len() - 64..].to_string()
    } else {
        pad_left(s, 64)
    }
}

/// Uppercase hex.
pub fn encode_upper(bytes: &[u8]) -> String {
    encode(bytes).to_uppercase()
}

/// Number of bytes a hex string decodes to.
pub fn byte_len(s: &str) -> usize {
    strip_0x(s).len() / 2
}

/// Reverse the byte order represented by a hex string.
pub fn reverse_bytes(s: &str) -> Option<String> {
    let mut b = decode(s)?;
    b.reverse();
    Some(encode(&b))
}

/// Single byte to two-char hex.
pub fn byte_to_hex(b: u8) -> String {
    let mut s = String::with_capacity(2);
    s.push(nibble_to_hex(b >> 4));
    s.push(nibble_to_hex(b & 0x0f));
    s
}

/// First `n` bytes of a hex string as hex.
pub fn take_bytes(s: &str, n: usize) -> String {
    let s = strip_0x(s);
    let end = (n * 2).min(s.len());
    s[..end].to_string()
}

/// Whether two hex strings represent the same bytes (case/prefix-insensitive).
pub fn eq(a: &str, b: &str) -> bool {
    strip_0x(a).eq_ignore_ascii_case(strip_0x(b))
}
