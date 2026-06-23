//! Argument / value parsing helpers.

/// Parse an i128 amount, accepting `_` separators.
pub fn amount(s: &str) -> Result<i128, String> {
    let cleaned: String = s.chars().filter(|c| *c != '_').collect();
    cleaned.trim().parse::<i128>().map_err(|_| format!("invalid amount: {s}"))
}

/// Parse a u32.
pub fn u32(s: &str) -> Result<u32, String> {
    s.trim().parse().map_err(|_| format!("invalid u32: {s}"))
}

/// Parse a usize index.
pub fn index(s: &str) -> Result<usize, String> {
    s.trim().parse().map_err(|_| format!("invalid index: {s}"))
}

/// Parse a yes/no/true/false flag.
pub fn boolean(s: &str) -> Result<bool, String> {
    match s.trim().to_ascii_lowercase().as_str() {
        "1" | "true" | "yes" | "y" | "on" => Ok(true),
        "0" | "false" | "no" | "n" | "off" => Ok(false),
        _ => Err(format!("invalid boolean: {s}")),
    }
}

/// Get a named `--flag value` from an args slice.
pub fn flag<'a>(args: &'a [String], name: &str) -> Option<&'a str> {
    let mut it = args.iter();
    while let Some(a) = it.next() {
        if a == name {
            return it.next().map(|s| s.as_str());
        }
        if let Some(rest) = a.strip_prefix(&format!("{name}=")) {
            return Some(rest);
        }
    }
    None
}

/// Whether a boolean `--flag` is present.
pub fn has_flag(args: &[String], name: &str) -> bool {
    args.iter().any(|a| a == name)
}

/// Positional args (those not starting with `-`).
pub fn positionals(args: &[String]) -> Vec<String> {
    args.iter().filter(|a| !a.starts_with('-')).cloned().collect()
}

/// Split a comma-separated list.
pub fn csv(s: &str) -> Vec<String> {
    s.split(',').map(|p| p.trim().to_string()).filter(|p| !p.is_empty()).collect()
}

/// Parse a list of i128 amounts from a comma list.
pub fn amount_list(s: &str) -> Result<Vec<i128>, String> {
    csv(s).iter().map(|p| amount(p)).collect()
}
