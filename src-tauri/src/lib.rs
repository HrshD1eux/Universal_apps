mod calculator_commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]

pub fn run() {
  tauri::Builder::default()
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
      calculator_commands::calculate_function_samples
    ])
    .run(tauri::generate_context!())

    .expect("error while running tauri application");
}
