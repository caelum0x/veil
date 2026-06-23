//! notetool — offline utilities for Veil coin notes.
//!
//! A "note" is the secret a user saves at deposit and needs to withdraw. These
//! commands work entirely offline (no network, no contract) and reuse the exact same
//! crypto as the on-chain contract and the prover, so they are a trustworthy way to
//! inspect, verify, or recover a note.

use clap::{Parser, Subcommand};
use coinutils::crypto::coin::generate_commitment;
use coinutils::crypto::conversions::{bls_scalar_to_decimal_string, decimal_string_to_bls_scalar};
use coinutils::crypto::poseidon::poseidon_hash;
use coinutils::types::CoinData;
use serde::Deserialize;
use soroban_sdk::Env;

#[derive(Deserialize)]
struct Note {
    coin: CoinData,
    #[serde(default)]
    commitment_hex: String,
}

#[derive(Parser)]
#[command(name = "notetool", about = "Offline utilities for Veil coin notes")]
struct Cli {
    #[command(subcommand)]
    command: Cmd,
}

#[derive(Subcommand)]
enum Cmd {
    /// Print the fields of a note.
    Inspect { file: String },
    /// Recompute the commitment from the note fields and check it matches.
    Verify { file: String },
    /// Derive the nullifier hash (the value the contract records to prevent reuse).
    Nullifier { file: String },
}

fn load(file: &str) -> Note {
    let text = std::fs::read_to_string(file).unwrap_or_else(|e| {
        eprintln!("error: cannot read {file}: {e}");
        std::process::exit(1);
    });
    serde_json::from_str(&text).unwrap_or_else(|e| {
        eprintln!("error: {file} is not a valid note: {e}");
        std::process::exit(1);
    })
}

fn main() {
    let cli = Cli::parse();
    let env = Env::default();
    env.cost_estimate().budget().reset_unlimited();

    match cli.command {
        Cmd::Inspect { file } => {
            let n = load(&file);
            println!("value:        {}", n.coin.value);
            println!("label:        {}", n.coin.label);
            println!("nullifier:    {}", n.coin.nullifier);
            println!("secret:       {}", n.coin.secret);
            println!("commitment:   {}", n.coin.commitment);
            if !n.commitment_hex.is_empty() {
                println!("commit (hex): {}", n.commitment_hex);
            }
        }
        Cmd::Verify { file } => {
            let n = load(&file);
            let value = decimal_string_to_bls_scalar(&env, &n.coin.value).unwrap();
            let label = decimal_string_to_bls_scalar(&env, &n.coin.label).unwrap();
            let nullifier = decimal_string_to_bls_scalar(&env, &n.coin.nullifier).unwrap();
            let secret = decimal_string_to_bls_scalar(&env, &n.coin.secret).unwrap();
            let recomputed = generate_commitment(&env, value, label, nullifier, secret);
            let recomputed_dec = bls_scalar_to_decimal_string(&recomputed);
            if recomputed_dec == n.coin.commitment {
                println!("✅ MATCH — commitment is consistent with the note fields");
            } else {
                println!("❌ MISMATCH — note is tampered or malformed");
                println!("  stored:     {}", n.coin.commitment);
                println!("  recomputed: {recomputed_dec}");
                std::process::exit(1);
            }
        }
        Cmd::Nullifier { file } => {
            let n = load(&file);
            let nullifier = decimal_string_to_bls_scalar(&env, &n.coin.nullifier).unwrap();
            let nh = poseidon_hash(&env, &[nullifier]);
            println!("nullifier_hash (dec): {}", bls_scalar_to_decimal_string(&nh));
            println!("nullifier_hash (hex): 0x{}", hex::encode(nh.to_bytes().to_array()));
        }
    }
}
