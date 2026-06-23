use crate::{
    crypto::{poseidon_hash, random_fr},
    types::{CoinData, GeneratedCoin},
};
use rand::{thread_rng, Rng};
use soroban_sdk::{crypto::bls12_381::Fr as BlsScalar, Bytes, Env, U256};

/// Generate a label for a coin based on scope and nonce
pub fn generate_label(env: &Env, scope: &[u8], nonce: &[u8; 32]) -> BlsScalar {
    // Convert scope and nonce to field elements for Poseidon hashing
    // Use only lower 31 bytes to ensure values are within BLS12-381 scalar field modulus
    let scope_fr = BlsScalar::from_u256({
        let mut bytes = [0u8; 32];
        let len = scope.len().min(31);
        // Place scope bytes in lower positions (big-endian U256, so pad at start)
        bytes[32 - len..].copy_from_slice(&scope[..len]);
        U256::from_be_bytes(env, &Bytes::from_slice(env, &bytes))
    });
    let nonce_fr = BlsScalar::from_u256({
        // Zero MSB and take the last 31 bytes of nonce to stay within field modulus
        let mut bytes = [0u8; 32];
        bytes[1..].copy_from_slice(&nonce[1..]);
        U256::from_be_bytes(env, &Bytes::from_slice(env, &bytes))
    });

    // Hash using Poseidon
    poseidon_hash(env, &[scope_fr, nonce_fr])
}

/// Generate a commitment for a coin
pub fn generate_commitment(
    env: &Env,
    value: BlsScalar,
    label: BlsScalar,
    nullifier: BlsScalar,
    secret: BlsScalar,
) -> BlsScalar {
    let precommitment = poseidon_hash(env, &[nullifier, secret]);
    poseidon_hash(env, &[value, label, precommitment])
}

/// Build a BLS12-381 scalar from a non-negative `i128` amount in stroops.
/// Encodes the amount as a 32-byte big-endian integer (low 16 bytes carry the
/// value), which keeps large denominations (e.g. 1000 XLM = 1e12 stroops) correct
/// — `U256::from_u32` would silently overflow above ~4.29 XLM.
fn value_to_scalar(env: &Env, value_stroops: i128) -> BlsScalar {
    let be = veil_encoding::amount_to_be32(value_stroops);
    BlsScalar::from_u256(U256::from_be_bytes(env, &Bytes::from_slice(env, &be)))
}

/// Generate a complete coin with all necessary components for a given denomination
/// (`value_stroops`, in stroops of the pooled token).
pub fn generate_coin(env: &Env, scope: &[u8], value_stroops: i128) -> GeneratedCoin {
    use crate::crypto::conversions::bls_scalar_to_decimal_string;

    let value = value_to_scalar(env, value_stroops);
    let nullifier = random_fr(env);
    let secret = random_fr(env);
    let nonce = thread_rng().gen::<[u8; 32]>();
    let label = generate_label(env, scope, &nonce);
    let commitment = generate_commitment(
        env,
        value.clone(),
        label.clone(),
        nullifier.clone(),
        secret.clone(),
    );

    let value_decimal = bls_scalar_to_decimal_string(&value);
    let nullifier_decimal = bls_scalar_to_decimal_string(&nullifier);
    let secret_decimal = bls_scalar_to_decimal_string(&secret);
    let label_decimal = bls_scalar_to_decimal_string(&label);
    let commitment_decimal = bls_scalar_to_decimal_string(&commitment);

    let coin_data = CoinData {
        value: value_decimal,
        nullifier: nullifier_decimal,
        secret: secret_decimal,
        label: label_decimal,
        commitment: commitment_decimal,
    };

    GeneratedCoin {
        coin: coin_data,
        commitment_hex: format!("0x{}", hex::encode(commitment.to_bytes().to_array())),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_label() {
        let env = Env::default();
        let scope = b"test_scope";
        let nonce = [1u8; 32];
        let result = generate_label(&env, scope, &nonce);
        // Just verify it doesn't panic and returns a valid scalar
        assert!(result.to_bytes().to_array().iter().any(|&x| x != 0));
    }

    #[test]
    fn test_generate_commitment() {
        let env = Env::default();
        let value = BlsScalar::from_u256(U256::from_u32(&env, 100));
        let label = BlsScalar::from_u256(U256::from_u32(&env, 200));
        let nullifier = BlsScalar::from_u256(U256::from_u32(&env, 300));
        let secret = BlsScalar::from_u256(U256::from_u32(&env, 400));

        let result = generate_commitment(&env, value, label, nullifier, secret);
        // Just verify it doesn't panic and returns a valid scalar
        assert!(result.to_bytes().to_array().iter().any(|&x| x != 0));
    }

    #[test]
    fn test_generate_coin() {
        let env = Env::default();
        let scope = b"test_scope";
        let result = generate_coin(&env, scope, 1_000_000_000);

        // Verify the coin has all required fields
        assert!(!result.coin.value.is_empty());
        assert!(!result.coin.nullifier.is_empty());
        assert!(!result.coin.secret.is_empty());
        assert!(!result.coin.label.is_empty());
        assert!(!result.coin.commitment.is_empty());
        assert!(result.commitment_hex.starts_with("0x"));
    }
}
