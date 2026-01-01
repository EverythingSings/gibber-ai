//! Gibber AI - Tauri backend library.
//!
//! This module contains the Tauri application setup and command handlers
//! for the Gibber AI desktop application.

mod commands;

/// Greets the user with a personalized message.
///
/// This is a sample command demonstrating Tauri's IPC mechanism.
/// It will be replaced with actual Gibber AI commands in later phases.
///
/// # Arguments
///
/// * `name` - The name to include in the greeting
///
/// # Returns
///
/// A greeting string formatted with the provided name
///
/// # Example
///
/// ```ignore
/// // From the frontend:
/// const message = await invoke("greet", { name: "World" });
/// // Returns: "Hello, World! You've been greeted from Rust!"
/// ```
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}! You've been greeted from Rust!")
}

/// Runs the Tauri application.
///
/// This function initializes the Tauri runtime, registers plugins,
/// and starts the application event loop.
///
/// # Panics
///
/// Panics if the Tauri application fails to initialize or run.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_keyring::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::credentials::get_api_key,
            commands::credentials::set_api_key,
            commands::credentials::delete_api_key,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
