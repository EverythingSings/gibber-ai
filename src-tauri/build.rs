//! Gibber AI - Tauri build script.
//!
//! This build script is run before compiling the main application.
//! It uses `tauri_build` to generate the necessary bindings and resources.

/// Main entry point for the Tauri build process.
///
/// This function invokes the Tauri build system to:
/// - Generate resource files
/// - Create platform-specific bindings
/// - Set up the application bundle configuration
fn main() {
    tauri_build::build();
}
