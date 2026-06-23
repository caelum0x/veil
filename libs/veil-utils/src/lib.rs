//! veil-utils — shared, dependency-free helper functions for the Veil project.
//!
//! Grouped into focused modules: hex strings, raw byte ops, endian conversions,
//! amount/denomination handling, 32-byte field-element helpers, and input
//! validation. Everything here is pure (no I/O, no allocation beyond returned
//! `String`/`Vec`) so it is reusable from the contract tooling, the CLIs, and tests.

pub mod amount;
pub mod bytes;
pub mod endian;
pub mod field;
pub mod hex;
pub mod validate;

/// Library version string.
pub fn version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}
