mod calculator_commands;
mod vault_commands;

use std::fs::OpenOptions;
use std::io::Write;

#[tauri::command]
fn secure_delete_file(path: String) -> Result<(), String> {
    // Overwrite file with zeroes to securely delete it (0 traces)
    if let Ok(mut file) = OpenOptions::new().write(true).open(&path) {
        if let Ok(metadata) = file.metadata() {
            let size = metadata.len();
            let zeroes = vec![0u8; 8192];
            let mut written = 0;
            while written < size {
                let to_write = std::cmp::min(8192, size - written) as usize;
                if let Err(e) = file.write_all(&zeroes[..to_write]) {
                    return Err(format!("Failed to overwrite file: {}", e));
                }
                written += to_write as u64;
            }
            let _ = file.sync_all();
        }
    } else {
        return Err("Failed to open file for secure deletion".into());
    }

    // Delete the file from filesystem
    std::fs::remove_file(&path).map_err(|e| format!("Failed to delete file: {}", e))
}

#[tauri::command]
fn clear_clipboard_history() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        
        // 1. Official WinRT Clear (Clears History + Current)
        let winrt_script = "
            try {
                $asmb = [Windows.ApplicationModel.DataTransfer.Clipboard, Windows.ApplicationModel.DataTransfer, ContentType = Assembly];
                [Windows.ApplicationModel.DataTransfer.Clipboard]::ClearHistory();
                [Windows.ApplicationModel.DataTransfer.Clipboard]::Clear();
            } catch {}
        ";
        let _ = Command::new("powershell")
            .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", winrt_script])
            .output();

        // 2. Fallback Flooding (If WinRT is blocked, we push it out of the list)
        let flood_script = "Add-Type -AssemblyName System.Windows.Forms; 1..31 | ForEach-Object { [System.Windows.Forms.Clipboard]::SetText(' ' * $_) }";
        let _ = Command::new("powershell")
            .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", flood_script])
            .output();

        // 3. Final Current Slot Wipe
        let _ = Command::new("cmd")
            .args(["/c", "echo off | clip"])
            .output();
    }
    Ok(())
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            secure_delete_file,
            clear_clipboard_history,
            calculator_commands::evaluate_scientific,
            calculator_commands::calculate_compound_interest,
            calculator_commands::convert_units,
            calculator_commands::calculate_emi,
            calculator_commands::calculate_gst,
            calculator_commands::calculate_age,
            calculator_commands::calculate_discount,
            calculator_commands::calculate_percentage,
            calculator_commands::calculate_salary,
            calculator_commands::calculate_tip,
            calculator_commands::calculate_roi,
            calculator_commands::calculate_date_math,
            calculator_commands::calculate_sip,
            calculator_commands::calculate_lumpsum,
            calculator_commands::calculate_mortgage,
            calculator_commands::calculate_local_byaj,
            calculator_commands::calculate_step_up_sip,
            calculator_commands::calculate_goal_sip,
            calculator_commands::calculate_fd_rd,
            calculator_commands::calculate_ppf,
            calculator_commands::calculate_statistics,
            calculator_commands::calculate_inflation,
            calculator_commands::calculate_nps,
            calculator_commands::solve_quadratic,
            calculator_commands::solve_cubic,
            calculator_commands::solve_quartic,
            calculator_commands::solve_linear_2,
            calculator_commands::solve_linear_3,
            calculator_commands::calculate_matrix_ops,
            calculator_commands::calculate_matrix_det,
            calculator_commands::base_convert,
            calculator_commands::calculate_bmi,
            calculator_commands::calculate_marks,
            calculator_commands::calculate_investment_comparison,
            calculator_commands::calculate_price_comparison,
            calculator_commands::calculate_real_return,
            calculator_commands::calculate_income_tax_india,
            calculator_commands::calculate_fire_projection,
            calculator_commands::calculate_stock_average,
            calculator_commands::calculate_function_samples,
            vault_commands::is_master_password_set,
            vault_commands::set_master_password,
            vault_commands::verify_master_password
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
