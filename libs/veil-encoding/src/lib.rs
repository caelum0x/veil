#![no_std]
//! Shared field-element encoding used by both the on-chain contract and the
//! off-chain tooling.
//!
//! Amounts (denominations, withdrawn values) cross the boundary between Rust `i128`
//! stroops and BLS12-381 / circom field elements. Both sides must agree on the byte
//! layout exactly, or a recomputed commitment won't match a deposited one. Keeping
//! the one canonical encoding here prevents the divergence that previously caused a
//! 32-bit truncation bug (`U256::from_u32(x as u32)`) on pools above ~4.29 XLM.

/// Encode a non-negative `i128` amount as a 32-byte **big-endian** integer — the same
/// representation a circom/snarkjs public signal uses. The low 16 bytes carry the
/// value; the high 16 bytes are zero.
///
/// ```
/// let be = veil_encoding::amount_to_be32(10_000_000_000);
/// assert_eq!(&be[0..16], &[0u8; 16]);
/// assert_eq!(u128::from_be_bytes(be[16..].try_into().unwrap()), 10_000_000_000);
/// ```
pub fn amount_to_be32(amount: i128) -> [u8; 32] {
    let mut be = [0u8; 32];
    be[16..].copy_from_slice(&amount.to_be_bytes());
    be
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encodes_large_values_without_truncation() {
        // 1000 XLM = 1e12 stroops, far above u32::MAX — the case that used to break.
        let be = amount_to_be32(1_000_000_000_000);
        let lo = u128::from_be_bytes(be[16..].try_into().unwrap());
        assert_eq!(lo, 1_000_000_000_000);
        assert_eq!(&be[0..16], &[0u8; 16]);
    }

    #[test]
    fn zero_encodes_to_all_zero() {
        assert_eq!(amount_to_be32(0), [0u8; 32]);
    }
}
