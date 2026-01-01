//! Credential management commands for secure API key storage.
//!
//! This module provides Tauri commands for storing, retrieving, and deleting
//! API keys using the operating system's secure keyring (Keychain on macOS,
//! Credential Manager on Windows, Secret Service on Linux).
//!
//! # Security
//!
//! - API keys are never logged or exposed in debug output
//! - Only the key length is logged for debugging purposes
//! - Keys are stored encrypted by the OS keyring

use tauri::AppHandle;
use tauri_plugin_keyring::KeyringExt;

/// The service identifier for Gibber AI in the system keyring.
/// This groups all Gibber AI credentials together.
const SERVICE_NAME: &str = "gibber-ai";

/// Error type for credential operations.
#[derive(Debug, serde::Serialize)]
pub struct CredentialError {
    /// Human-readable error message
    pub message: String,
    /// Error code for programmatic handling
    pub code: String,
}

impl From<keyring::Error> for CredentialError {
    fn from(err: keyring::Error) -> Self {
        let code = match &err {
            keyring::Error::NoEntry => "NO_ENTRY",
            keyring::Error::Ambiguous(_) => "AMBIGUOUS",
            keyring::Error::BadEncoding(_) => "BAD_ENCODING",
            keyring::Error::TooLong(_, _) => "TOO_LONG",
            keyring::Error::Invalid(_, _) => "INVALID",
            keyring::Error::NoStorageAccess(_) => "NO_STORAGE_ACCESS",
            keyring::Error::PlatformFailure(_) => "PLATFORM_FAILURE",
            _ => "UNKNOWN",
        };
        Self {
            message: err.to_string(),
            code: code.to_string(),
        }
    }
}

/// Checks if an error indicates the credential doesn't exist.
const fn is_no_entry(err: &keyring::Error) -> bool {
    matches!(err, keyring::Error::NoEntry)
}

/// Retrieves an API key from the system keyring.
///
/// # Arguments
///
/// * `app` - The Tauri application handle
/// * `service` - The service identifier (e.g., "openrouter", "nostr")
///
/// # Returns
///
/// The API key if found, or `None` if the key doesn't exist.
///
/// # Errors
///
/// Returns a `CredentialError` if the keyring operation fails.
///
/// # Example
///
/// ```typescript
/// // From the frontend:
/// const apiKey = await invoke("get_api_key", { service: "openrouter" });
/// if (apiKey) {
///   console.log(`API key length: ${apiKey.length}`);
/// }
/// ```
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri commands require AppHandle by value
pub fn get_api_key(app: AppHandle, service: &str) -> Result<Option<String>, CredentialError> {
    let keyring = app.keyring();
    match keyring.get_password(SERVICE_NAME, service) {
        Ok(password) => Ok(password),
        Err(e) if is_no_entry(&e) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

/// Stores an API key in the system keyring.
///
/// If a key already exists for the given service, it will be overwritten.
///
/// # Arguments
///
/// * `app` - The Tauri application handle
/// * `service` - The service identifier (e.g., "openrouter", "nostr")
/// * `key` - The API key to store
///
/// # Errors
///
/// Returns a `CredentialError` if the keyring operation fails.
///
/// # Example
///
/// ```typescript
/// // From the frontend:
/// await invoke("set_api_key", { service: "openrouter", key: "sk-..." });
/// ```
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri commands require AppHandle by value
pub fn set_api_key(app: AppHandle, service: &str, key: &str) -> Result<(), CredentialError> {
    let keyring = app.keyring();
    keyring.set_password(SERVICE_NAME, service, key)?;
    Ok(())
}

/// Deletes an API key from the system keyring.
///
/// # Arguments
///
/// * `app` - The Tauri application handle
/// * `service` - The service identifier (e.g., "openrouter", "nostr")
///
/// # Returns
///
/// Returns `true` if the key was deleted, `false` if it didn't exist.
///
/// # Errors
///
/// Returns a `CredentialError` if the keyring operation fails (other than key not found).
///
/// # Example
///
/// ```typescript
/// // From the frontend:
/// const deleted = await invoke("delete_api_key", { service: "openrouter" });
/// console.log(deleted ? "Key deleted" : "Key not found");
/// ```
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri commands require AppHandle by value
pub fn delete_api_key(app: AppHandle, service: &str) -> Result<bool, CredentialError> {
    let keyring = app.keyring();
    match keyring.delete_password(SERVICE_NAME, service) {
        Ok(()) => Ok(true),
        Err(e) if is_no_entry(&e) => Ok(false),
        Err(e) => Err(e.into()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_service_name_is_valid() {
        // Ensure service name doesn't contain problematic characters
        assert!(!SERVICE_NAME.is_empty());
        assert!(!SERVICE_NAME.contains(' '));
        assert!(!SERVICE_NAME.contains('\n'));
    }

    #[test]
    fn test_credential_error_serializes() {
        let error = CredentialError {
            message: "Test error".to_string(),
            code: "TEST_CODE".to_string(),
        };
        let json = serde_json::to_string(&error).expect("Should serialize");
        assert!(json.contains("Test error"));
        assert!(json.contains("TEST_CODE"));
    }

    #[test]
    fn test_is_no_entry() {
        assert!(is_no_entry(&keyring::Error::NoEntry));
    }
}
