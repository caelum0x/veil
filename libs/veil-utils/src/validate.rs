//! Lightweight input validation helpers.

/// True if `s` is a plausible Stellar public key strkey (starts with G, length 56).
pub fn is_stellar_account(s: &str) -> bool {
    s.len() == 56 && s.starts_with('G') && s.bytes().all(|c| c.is_ascii_alphanumeric())
}

/// True if `s` is a plausible Soroban contract id strkey (starts with C, length 56).
pub fn is_contract_id(s: &str) -> bool {
    s.len() == 56 && s.starts_with('C') && s.bytes().all(|c| c.is_ascii_alphanumeric())
}

/// True if `s` is a decimal integer string (optionally signed).
pub fn is_decimal_int(s: &str) -> bool {
    let s = s.strip_prefix('-').unwrap_or(s);
    !s.is_empty() && s.bytes().all(|c| c.is_ascii_digit())
}

/// True if `v` is within the inclusive range.
pub fn in_range(v: i128, lo: i128, hi: i128) -> bool {
    v >= lo && v <= hi
}

/// True if `v` is strictly positive.
pub fn is_positive(v: i128) -> bool {
    v > 0
}

/// True if `v` is non-negative.
pub fn is_non_negative(v: i128) -> bool {
    v >= 0
}

/// True if a string is non-empty after trimming.
pub fn is_non_empty(s: &str) -> bool {
    !s.trim().is_empty()
}

/// True if a slice is exactly `n` bytes.
pub fn has_len(b: &[u8], n: usize) -> bool {
    b.len() == n
}

/// True if a hex string decodes to exactly 32 bytes.
pub fn is_hex32(s: &str) -> bool {
    let s = s.strip_prefix("0x").or_else(|| s.strip_prefix("0X")).unwrap_or(s);
    s.len() == 64 && s.bytes().all(|c| c.is_ascii_hexdigit())
}

/// True if `v` fits in a u32 (the bound that used to silently truncate amounts).
pub fn fits_u32(v: i128) -> bool {
    v >= 0 && v <= u32::MAX as i128
}

/// True if `v` fits in a u64.
pub fn fits_u64(v: i128) -> bool {
    v >= 0 && v <= u64::MAX as i128
}

/// Clamp a value into [lo, hi].
pub fn clamp(v: i128, lo: i128, hi: i128) -> i128 {
    v.clamp(lo, hi)
}

/// Returns `Ok(v)` if positive, else an error message.
pub fn require_positive(v: i128) -> Result<i128, String> {
    if v > 0 {
        Ok(v)
    } else {
        Err(format!("expected a positive value, got {v}"))
    }
}

/// Returns `Ok(())` if the account looks valid, else an error message.
pub fn require_account(s: &str) -> Result<(), String> {
    if is_stellar_account(s) {
        Ok(())
    } else {
        Err(format!("invalid Stellar account: {s}"))
    }
}

/// True if all elements are unique.
pub fn all_unique<T: PartialEq>(items: &[T]) -> bool {
    for i in 0..items.len() {
        for j in (i + 1)..items.len() {
            if items[i] == items[j] {
                return false;
            }
        }
    }
    true
}
