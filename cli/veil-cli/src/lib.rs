//! veil-cli — shared presentation/IO helpers for the Veil command-line tools.
//!
//! Formatting, ANSI color, simple tables, key/value reports, file IO, and argument
//! parsing. Pure helpers; the binaries (`coinutils`, `notetool`, `circom2soroban`,
//! and future tools) compose them.

pub mod color;
pub mod fmt;
pub mod io;
pub mod parse;
pub mod report;
pub mod table;

/// Crate version.
pub fn version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}
