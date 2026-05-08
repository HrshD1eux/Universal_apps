use tauri::{AppHandle, Manager};
use std::fs;
use sha2::{Sha256, Digest};

fn get_hash_path(app: &AppHandle) -> std::path::PathBuf {
    let mut path = app.path().app_data_dir().unwrap_or_default();
    if !path.exists() {
        let _ = fs::create_dir_all(&path);
    }
    path.push("vault_auth.bin");
    path
}

#[tauri::command]
pub fn is_master_password_set(app: AppHandle) -> bool {
    get_hash_path(&app).exists()
}

#[tauri::command]
pub fn set_master_password(app: AppHandle, password: String) -> Result<(), String> {
    let path = get_hash_path(&app);
    if path.exists() {
        return Err("Master password already exists and cannot be changed.".into());
    }

    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    let hash = hasher.finalize();

    fs::write(path, hash).map_err(|e| format!("Failed to save master password: {}", e))
}

#[tauri::command]
pub fn verify_master_password(app: AppHandle, password: String) -> bool {
    let path = get_hash_path(&app);
    if !path.exists() {
        return false;
    }

    let stored_hash = match fs::read(path) {
        Ok(h) => h,
        Err(_) => return false,
    };

    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    let hash = hasher.finalize();

    hash.as_slice() == stored_hash.as_slice()
}
