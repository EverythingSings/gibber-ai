//! Gibber AI - Tauri application entry point.
//!
//! This is the main entry point for the Gibber AI desktop application.
//! It initializes the Tauri runtime and launches the application window.

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    gibber_ai_lib::run();
}
