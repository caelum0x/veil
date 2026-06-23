//! Minimal fixed-width ASCII table renderer.

pub struct Table {
    headers: Vec<String>,
    rows: Vec<Vec<String>>,
}

impl Table {
    pub fn new(headers: &[&str]) -> Self {
        Self {
            headers: headers.iter().map(|h| h.to_string()).collect(),
            rows: Vec::new(),
        }
    }

    pub fn push(&mut self, row: &[String]) {
        self.rows.push(row.to_vec());
    }

    pub fn push_str(&mut self, row: &[&str]) {
        self.rows.push(row.iter().map(|s| s.to_string()).collect());
    }

    pub fn row_count(&self) -> usize {
        self.rows.len()
    }

    pub fn col_count(&self) -> usize {
        self.headers.len()
    }

    fn widths(&self) -> Vec<usize> {
        let mut w: Vec<usize> = self.headers.iter().map(|h| h.len()).collect();
        for row in &self.rows {
            for (i, cell) in row.iter().enumerate() {
                if i < w.len() {
                    w[i] = w[i].max(cell.len());
                }
            }
        }
        w
    }

    pub fn render(&self) -> String {
        let w = self.widths();
        let mut out = String::new();
        let fmt_row = |cells: &[String]| -> String {
            cells
                .iter()
                .enumerate()
                .map(|(i, c)| format!("{c:<width$}", width = w.get(i).copied().unwrap_or(0)))
                .collect::<Vec<_>>()
                .join("  ")
        };
        out.push_str(&fmt_row(&self.headers));
        out.push('\n');
        out.push_str(&w.iter().map(|n| "─".repeat(*n)).collect::<Vec<_>>().join("  "));
        out.push('\n');
        for row in &self.rows {
            out.push_str(&fmt_row(row));
            out.push('\n');
        }
        out
    }

    pub fn print(&self) {
        print!("{}", self.render());
    }
}
