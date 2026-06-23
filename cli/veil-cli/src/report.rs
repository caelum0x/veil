//! Key/value report builder for human-readable CLI output.

/// Accumulates aligned `key: value` rows.
pub struct Report {
    title: Option<String>,
    rows: Vec<(String, String)>,
}

impl Report {
    pub fn new() -> Self {
        Self { title: None, rows: Vec::new() }
    }

    pub fn titled(title: &str) -> Self {
        Self { title: Some(title.to_string()), rows: Vec::new() }
    }

    pub fn row(mut self, key: &str, value: impl Into<String>) -> Self {
        self.rows.push((key.to_string(), value.into()));
        self
    }

    pub fn row_if(self, cond: bool, key: &str, value: impl Into<String>) -> Self {
        if cond {
            self.row(key, value)
        } else {
            self
        }
    }

    pub fn len(&self) -> usize {
        self.rows.len()
    }

    pub fn is_empty(&self) -> bool {
        self.rows.is_empty()
    }

    pub fn render(&self) -> String {
        let width = self.rows.iter().map(|(k, _)| k.len()).max().unwrap_or(0);
        let mut out = String::new();
        if let Some(t) = &self.title {
            out.push_str(t);
            out.push('\n');
        }
        for (k, v) in &self.rows {
            out.push_str(&format!("  {k:<width$}  {v}\n", width = width));
        }
        out
    }

    pub fn print(&self) {
        print!("{}", self.render());
    }
}

impl Default for Report {
    fn default() -> Self {
        Self::new()
    }
}
