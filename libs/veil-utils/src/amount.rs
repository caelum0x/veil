//! Amount/denomination helpers. This project treats 1 XLM = 1_000_000_000 stroops.

/// Stroops per whole unit in this project's convention.
pub const STROOPS_PER_UNIT: i128 = 1_000_000_000;

/// Supported pool denominations in stroops.
pub const DENOMS: [i128; 4] = [
    1_000_000_000,
    10_000_000_000,
    100_000_000_000,
    1_000_000_000_000,
];

/// Whole units (XLM) from stroops, truncating.
pub fn to_units(stroops: i128) -> i128 {
    stroops / STROOPS_PER_UNIT
}

/// Stroops from whole units.
pub fn from_units(units: i128) -> i128 {
    units * STROOPS_PER_UNIT
}

/// Format stroops as a decimal unit string, e.g. 1_500_000_000 -> "1.5".
pub fn format(stroops: i128) -> String {
    let neg = stroops < 0;
    let s = stroops.unsigned_abs();
    let whole = s / STROOPS_PER_UNIT as u128;
    let frac = s % STROOPS_PER_UNIT as u128;
    let mut frac_str = format!("{:09}", frac);
    while frac_str.ends_with('0') {
        frac_str.pop();
    }
    let body = if frac_str.is_empty() {
        format!("{whole}")
    } else {
        format!("{whole}.{frac_str}")
    };
    if neg {
        format!("-{body}")
    } else {
        body
    }
}

/// Parse a decimal unit string ("1.5") into stroops. `None` on bad input.
pub fn parse(s: &str) -> Option<i128> {
    let s = s.trim();
    let (neg, s) = match s.strip_prefix('-') {
        Some(rest) => (true, rest),
        None => (false, s),
    };
    let mut parts = s.split('.');
    let whole: i128 = parts.next()?.parse().ok()?;
    let frac_str = parts.next().unwrap_or("0");
    if parts.next().is_some() || frac_str.len() > 9 {
        return None;
    }
    let frac_padded = format!("{:0<9}", frac_str);
    let frac: i128 = frac_padded.parse().ok()?;
    let total = whole * STROOPS_PER_UNIT + frac;
    Some(if neg { -total } else { total })
}

/// True if `stroops` exactly matches one of the supported denominations.
pub fn is_supported_denom(stroops: i128) -> bool {
    DENOMS.contains(&stroops)
}

/// The largest supported denomination not exceeding `stroops`.
pub fn largest_denom_below(stroops: i128) -> Option<i128> {
    DENOMS.iter().rev().copied().find(|&d| d <= stroops)
}

/// Greedily decompose an amount into supported denominations.
pub fn decompose(mut stroops: i128) -> Vec<i128> {
    let mut out = Vec::new();
    for &d in DENOMS.iter().rev() {
        while stroops >= d {
            out.push(d);
            stroops -= d;
        }
    }
    out
}

/// Index of a denomination in `DENOMS`.
pub fn denom_index(stroops: i128) -> Option<usize> {
    DENOMS.iter().position(|&d| d == stroops)
}

/// Human label for a denomination, e.g. "10 XLM".
pub fn denom_label(stroops: i128) -> String {
    format!("{} XLM", format(stroops))
}

/// Clamp an amount to the [min, max] supported denomination range.
pub fn clamp_denom(stroops: i128) -> i128 {
    let lo = DENOMS[0];
    let hi = DENOMS[DENOMS.len() - 1];
    stroops.clamp(lo, hi)
}

/// Total of a list of amounts (saturating).
pub fn sum(amounts: &[i128]) -> i128 {
    amounts.iter().fold(0i128, |a, &b| a.saturating_add(b))
}

/// True if amount is strictly positive.
pub fn is_positive(stroops: i128) -> bool {
    stroops > 0
}

/// Basis-point fee on an amount (rounded down).
pub fn fee_bps(stroops: i128, bps: i128) -> i128 {
    stroops * bps / 10_000
}

/// Amount remaining after a basis-point fee.
pub fn after_fee_bps(stroops: i128, bps: i128) -> i128 {
    stroops - fee_bps(stroops, bps)
}
