#![allow(non_snake_case)]

pub use crate::domain::host_capabilities::{
    require_host_capability, require_host_capability_supported, HostCapabilities, HostCapability,
};

use crate::domain::host_capabilities::current_host_capabilities;

#[tauri::command]
pub fn app__get_host_capabilities() -> HostCapabilities {
    current_host_capabilities()
}
