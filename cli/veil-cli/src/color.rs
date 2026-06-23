//! Minimal ANSI color helpers (no deps).

const RESET: &str = "\x1b[0m";

fn wrap(code: &str, s: &str) -> String {
    format!("\x1b[{code}m{s}{RESET}")
}

pub fn red(s: &str) -> String {
    wrap("31", s)
}
pub fn green(s: &str) -> String {
    wrap("32", s)
}
pub fn yellow(s: &str) -> String {
    wrap("33", s)
}
pub fn blue(s: &str) -> String {
    wrap("34", s)
}
pub fn magenta(s: &str) -> String {
    wrap("35", s)
}
pub fn cyan(s: &str) -> String {
    wrap("36", s)
}
pub fn gray(s: &str) -> String {
    wrap("90", s)
}
pub fn bold(s: &str) -> String {
    wrap("1", s)
}
pub fn dim(s: &str) -> String {
    wrap("2", s)
}
pub fn ok(s: &str) -> String {
    green(&format!("✓ {s}"))
}
pub fn err(s: &str) -> String {
    red(&format!("✗ {s}"))
}
pub fn warn(s: &str) -> String {
    yellow(&format!("⚠ {s}"))
}
pub fn arrow(s: &str) -> String {
    cyan(&format!("▸ {s}"))
}
pub fn strip(s: &str) -> String {
    // remove simple ANSI sequences
    let mut out = String::with_capacity(s.len());
    let mut in_esc = false;
    for c in s.chars() {
        if in_esc {
            if c == 'm' {
                in_esc = false;
            }
        } else if c == '\x1b' {
            in_esc = true;
        } else {
            out.push(c);
        }
    }
    out
}
