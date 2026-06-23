//! File IO helpers wrapping `std::fs` with friendly errors.

use std::fs;
use std::path::Path;

pub fn read(path: &str) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| format!("cannot read {path}: {e}"))
}

pub fn write(path: &str, content: &str) -> Result<(), String> {
    fs::write(path, content).map_err(|e| format!("cannot write {path}: {e}"))
}

pub fn exists(path: &str) -> bool {
    Path::new(path).exists()
}

pub fn is_file(path: &str) -> bool {
    Path::new(path).is_file()
}

pub fn is_dir(path: &str) -> bool {
    Path::new(path).is_dir()
}

pub fn mkdirs(path: &str) -> Result<(), String> {
    fs::create_dir_all(path).map_err(|e| format!("cannot create {path}: {e}"))
}

pub fn remove(path: &str) -> Result<(), String> {
    if exists(path) {
        fs::remove_file(path).map_err(|e| format!("cannot remove {path}: {e}"))
    } else {
        Ok(())
    }
}

pub fn file_size(path: &str) -> Option<u64> {
    fs::metadata(path).ok().map(|m| m.len())
}

pub fn extension(path: &str) -> Option<String> {
    Path::new(path).extension().and_then(|e| e.to_str()).map(|s| s.to_string())
}

pub fn stem(path: &str) -> Option<String> {
    Path::new(path).file_stem().and_then(|e| e.to_str()).map(|s| s.to_string())
}

pub fn filename(path: &str) -> Option<String> {
    Path::new(path).file_name().and_then(|e| e.to_str()).map(|s| s.to_string())
}

pub fn read_lines(path: &str) -> Result<Vec<String>, String> {
    Ok(read(path)?.lines().map(|l| l.to_string()).collect())
}

pub fn append(path: &str, content: &str) -> Result<(), String> {
    use std::io::Write;
    let mut f = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)
        .map_err(|e| format!("cannot open {path}: {e}"))?;
    f.write_all(content.as_bytes()).map_err(|e| format!("cannot append {path}: {e}"))
}
