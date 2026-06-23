//! Text formatting helpers.

use veil_utils::amount;

/// Format stroops as an "N XLM" label.
pub fn xlm(stroops: i128) -> String {
    format!("{} XLM", amount::format(stroops))
}

/// Truncate a string to `n` chars with an ellipsis.
pub fn truncate(s: &str, n: usize) -> String {
    if s.chars().count() <= n {
        s.to_string()
    } else {
        let head: String = s.chars().take(n.saturating_sub(1)).collect();
        format!("{head}…")
    }
}

/// Middle-truncate (keep head and tail), e.g. for long hashes.
pub fn middle(s: &str, head: usize, tail: usize) -> String {
    if s.len() <= head + tail + 1 {
        s.to_string()
    } else {
        format!("{}…{}", &s[..head], &s[s.len() - tail..])
    }
}

/// Right-pad to width.
pub fn pad(s: &str, width: usize) -> String {
    format!("{s:<width$}")
}

/// Left-pad to width.
pub fn lpad(s: &str, width: usize) -> String {
    format!("{s:>width$}")
}

/// Pluralize a noun based on count.
pub fn plural(n: usize, singular: &str, plural: &str) -> String {
    if n == 1 {
        format!("{n} {singular}")
    } else {
        format!("{n} {plural}")
    }
}

/// Format a count with thousands separators.
pub fn commas(n: u128) -> String {
    let s = n.to_string();
    let mut out = String::new();
    let bytes = s.as_bytes();
    for (i, c) in bytes.iter().enumerate() {
        if i > 0 && (bytes.len() - i) % 3 == 0 {
            out.push(',');
        }
        out.push(*c as char);
    }
    out
}

/// Capitalize the first letter.
pub fn capitalize(s: &str) -> String {
    let mut chars = s.chars();
    match chars.next() {
        Some(c) => c.to_uppercase().collect::<String>() + chars.as_str(),
        None => String::new(),
    }
}

/// Indent every line by `spaces`.
pub fn indent(s: &str, spaces: usize) -> String {
    let pad = " ".repeat(spaces);
    s.lines().map(|l| format!("{pad}{l}")).collect::<Vec<_>>().join("\n")
}

/// A simple ascii progress bar of `width` for `frac` in [0,1].
pub fn bar(frac: f64, width: usize) -> String {
    let filled = ((frac.clamp(0.0, 1.0)) * width as f64).round() as usize;
    format!("[{}{}]", "█".repeat(filled), "░".repeat(width - filled))
}

/// Bytes to a human size string.
pub fn bytes_human(n: u64) -> String {
    const UNITS: [&str; 5] = ["B", "KB", "MB", "GB", "TB"];
    let mut v = n as f64;
    let mut i = 0;
    while v >= 1024.0 && i < UNITS.len() - 1 {
        v /= 1024.0;
        i += 1;
    }
    format!("{v:.1}{}", UNITS[i])
}

/// Join items with a separator.
pub fn join(items: &[String], sep: &str) -> String {
    items.join(sep)
}

/// A horizontal rule string.
pub fn rule(width: usize) -> String {
    "─".repeat(width)
}
