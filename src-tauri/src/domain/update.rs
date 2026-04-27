use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, AtomicI32, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};

use base64::Engine;
use serde::{Deserialize, Serialize};
use tauri_plugin_updater::UpdaterExt;

const UPDATE_PROGRESS_IDLE: i32 = 0;
const UPDATE_PROGRESS_ERROR: i32 = -1;
// IPC progress contract: 0..=100 is visible download percent, 101 means ready to install.
const UPDATE_PROGRESS_READY: i32 = 101;
const TAURI_UPDATE_PACKAGE_FILE: &str = "tauri-update.bin";
const TAURI_UPDATE_METADATA_FILE: &str = "tauri-update.json";

#[derive(Debug, Deserialize, Serialize)]
struct PendingTauriUpdate {
    manifest_url: String,
    target: String,
    version: String,
    download_url: String,
    signature: String,
}

pub struct UpdateManager {
    app_data: PathBuf,
    progress: Arc<AtomicI32>,
    cancel: Arc<AtomicBool>,
    generation: Arc<AtomicU64>,
    finalize_lock: Arc<Mutex<()>>,
    proxy_url: Option<String>,
}

impl UpdateManager {
    pub fn new(app_data: PathBuf, proxy_url: Option<&str>) -> Self {
        Self {
            app_data,
            progress: Arc::new(AtomicI32::new(0)),
            cancel: Arc::new(AtomicBool::new(false)),
            generation: Arc::new(AtomicU64::new(0)),
            finalize_lock: Arc::new(Mutex::new(())),
            proxy_url: proxy_url.map(|s| s.to_string()),
        }
    }

    pub fn check_for_tauri_update(&self) -> bool {
        self.app_data.join(TAURI_UPDATE_PACKAGE_FILE).exists()
            && self.app_data.join(TAURI_UPDATE_METADATA_FILE).exists()
    }

    pub fn start_tauri_download(
        &self,
        app_handle: tauri::AppHandle,
        manifest_url: String,
        target: String,
    ) {
        let app_data = self.app_data.clone();
        let progress = self.progress.clone();
        let cancel = self.cancel.clone();
        let generation_state = self.generation.clone();
        let finalize_lock = self.finalize_lock.clone();
        let proxy_url = self.proxy_url.clone();
        let generation = {
            let _guard = self.finalize_lock.lock().unwrap_or_else(|e| e.into_inner());
            let generation = generation_state.fetch_add(1, Ordering::SeqCst) + 1;
            progress.store(UPDATE_PROGRESS_IDLE, Ordering::Relaxed);
            cancel.store(false, Ordering::Relaxed);
            generation
        };

        tauri::async_runtime::spawn(async move {
            if let Err(e) = do_tauri_download(
                app_handle,
                &app_data,
                &manifest_url,
                &target,
                &progress,
                &cancel,
                &generation_state,
                generation,
                &finalize_lock,
                proxy_url.as_deref(),
            )
            .await
            {
                if generation_state.load(Ordering::SeqCst) == generation {
                    tracing::error!("Tauri update download error: {e}");
                    progress.store(UPDATE_PROGRESS_ERROR, Ordering::Relaxed);
                } else {
                    tracing::debug!("Superseded Tauri update download stopped: {e}");
                }
            }
        });
    }

    pub async fn install_tauri_update(&self, app_handle: tauri::AppHandle) -> Result<(), String> {
        do_install_tauri_update(app_handle, &self.app_data, self.proxy_url.as_deref()).await
    }

    pub fn cancel_download(&self) {
        self.cancel.store(true, Ordering::Relaxed);
        self.progress.store(UPDATE_PROGRESS_IDLE, Ordering::Relaxed);

        let temp = self.app_data.join(format!(
            "tauri-update-{}.bin",
            self.generation.load(Ordering::SeqCst)
        ));
        let _ = std::fs::remove_file(&temp);
    }

    pub fn check_progress(&self) -> i32 {
        self.progress.load(Ordering::Relaxed)
    }
}

fn validate_tauri_update_manifest_url(manifest_url: &str) -> Result<reqwest::Url, String> {
    let url = reqwest::Url::parse(manifest_url)
        .map_err(|e| format!("invalid Tauri updater manifest URL: {e}"))?;
    if url.scheme() != "https" {
        return Err("Tauri updater manifest URL must use https".into());
    }
    if url.host_str() != Some("github.com") {
        return Err("Tauri updater manifest URL host is not allowed".into());
    }
    let path = url.path();
    if !path.starts_with("/Map1en/VRCX-0/releases/download/")
        || !path
            .rsplit('/')
            .next()
            .unwrap_or("")
            .starts_with("vrcx-0-updater-")
        || !path.to_ascii_lowercase().ends_with(".json")
    {
        return Err("Tauri updater manifest URL path is not allowed".into());
    }
    Ok(url)
}

fn validate_tauri_update_target(target: &str) -> Result<(), String> {
    let Some((platform, channel)) = target.rsplit_once('-') else {
        return Err("Tauri updater target is not allowed".into());
    };
    let valid_platform = platform == current_tauri_updater_platform();
    let valid_channel = matches!(channel, "stable" | "beta" | "alpha");
    if !valid_platform || !valid_channel {
        return Err("Tauri updater target is not allowed on this platform".into());
    }
    Ok(())
}

fn current_tauri_updater_platform() -> &'static str {
    #[cfg(target_os = "linux")]
    {
        "linux-x86_64"
    }
    #[cfg(target_os = "windows")]
    {
        "windows-x86_64"
    }
    #[cfg(not(any(target_os = "linux", target_os = "windows")))]
    {
        ""
    }
}

fn decode_tauri_signing_value(value: &str, label: &str) -> Result<String, String> {
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(value.trim())
        .map_err(|e| format!("decode {label}: {e}"))?;
    String::from_utf8(bytes).map_err(|e| format!("decode {label} utf8: {e}"))
}

fn tauri_updater_public_key() -> Result<String, String> {
    match option_env!("TAURI_UPDATER_PUBLIC_KEY") {
        Some(value) if !value.trim().is_empty() => Ok(value.to_string()),
        _ => Err("TAURI_UPDATER_PUBLIC_KEY is not configured.".into()),
    }
}

fn verify_tauri_update_signature(bytes: &[u8], release_signature: &str) -> Result<(), String> {
    let pub_key = decode_tauri_signing_value(&tauri_updater_public_key()?, "updater pubkey")?;
    let public_key =
        minisign_verify::PublicKey::decode(&pub_key).map_err(|e| format!("pubkey: {e}"))?;
    let signature = decode_tauri_signing_value(release_signature, "updater signature")?;
    let signature =
        minisign_verify::Signature::decode(&signature).map_err(|e| format!("signature: {e}"))?;
    public_key
        .verify(bytes, &signature, true)
        .map_err(|e| format!("verify update signature: {e}"))
}

async fn build_tauri_update(
    app_handle: tauri::AppHandle,
    manifest_url: &str,
    target: &str,
    proxy_url: Option<&str>,
) -> Result<tauri_plugin_updater::Update, String> {
    validate_tauri_update_target(target)?;
    let manifest_url = validate_tauri_update_manifest_url(manifest_url)?;
    let mut builder = app_handle
        .updater_builder()
        .endpoints(vec![manifest_url])
        .map_err(|e| format!("updater endpoint: {e}"))?
        .target(target.to_string())
        .version_comparator(|_, _| true);

    if let Some(proxy_url) = proxy_url.filter(|value| !value.trim().is_empty()) {
        let proxy = reqwest::Url::parse(proxy_url).map_err(|e| format!("proxy: {e}"))?;
        builder = builder.proxy(proxy);
    }

    builder
        .build()
        .map_err(|e| format!("updater build: {e}"))?
        .check()
        .await
        .map_err(|e| format!("updater check: {e}"))?
        .ok_or_else(|| "No Tauri update is available.".to_string())
}

async fn do_tauri_download(
    app_handle: tauri::AppHandle,
    app_data: &std::path::Path,
    manifest_url: &str,
    target: &str,
    progress: &AtomicI32,
    cancel: &AtomicBool,
    generation_state: &AtomicU64,
    generation: u64,
    finalize_lock: &Mutex<()>,
    proxy_url: Option<&str>,
) -> Result<(), String> {
    let update = build_tauri_update(app_handle, manifest_url, target, proxy_url).await?;
    let update_version = update.version.clone();
    let update_download_url = update.download_url.to_string();
    let update_signature = update.signature.clone();
    let temp_path = app_data.join(format!("tauri-update-{generation}.bin"));
    let package_path = app_data.join(TAURI_UPDATE_PACKAGE_FILE);
    let metadata_path = app_data.join(TAURI_UPDATE_METADATA_FILE);

    let _ = std::fs::remove_file(&temp_path);

    let mut downloaded = 0u64;
    let bytes = update
        .download(
            |chunk_size, content_length| {
                downloaded = downloaded.saturating_add(chunk_size as u64);
                if generation_state.load(Ordering::SeqCst) != generation {
                    return;
                }
                if let Some(total) = content_length.filter(|value| *value > 0) {
                    let pct = ((downloaded as f64 / total as f64) * 100.0).round() as i32;
                    progress.store(pct.clamp(0, 100), Ordering::Relaxed);
                }
            },
            || {
                if generation_state.load(Ordering::SeqCst) == generation {
                    progress.store(100, Ordering::Relaxed);
                }
            },
        )
        .await
        .map_err(|e| format!("updater download: {e}"))?;

    if cancel.load(Ordering::Relaxed) || generation_state.load(Ordering::SeqCst) != generation {
        return Err("cancelled".into());
    }

    std::fs::write(&temp_path, bytes).map_err(|e| format!("write Tauri update package: {e}"))?;
    let metadata = PendingTauriUpdate {
        manifest_url: manifest_url.to_string(),
        target: target.to_string(),
        version: update_version,
        download_url: update_download_url,
        signature: update_signature,
    };
    let metadata = serde_json::to_vec(&metadata).map_err(|e| format!("serialize metadata: {e}"))?;

    {
        let _guard = finalize_lock
            .lock()
            .map_err(|e| format!("Tauri update finalize lock: {e}"))?;
        if cancel.load(Ordering::Relaxed) || generation_state.load(Ordering::SeqCst) != generation {
            let _ = std::fs::remove_file(&temp_path);
            return Err("cancelled".into());
        }

        let _ = std::fs::remove_file(&package_path);
        let _ = std::fs::remove_file(&metadata_path);
        std::fs::rename(&temp_path, &package_path)
            .map_err(|e| format!("move Tauri update package: {e}"))?;
        std::fs::write(&metadata_path, metadata)
            .map_err(|e| format!("write Tauri update metadata: {e}"))?;

        if generation_state.load(Ordering::SeqCst) == generation {
            progress.store(UPDATE_PROGRESS_READY, Ordering::Relaxed);
        }
    }

    Ok(())
}

async fn do_install_tauri_update(
    app_handle: tauri::AppHandle,
    app_data: &std::path::Path,
    proxy_url: Option<&str>,
) -> Result<(), String> {
    let package_path = app_data.join(TAURI_UPDATE_PACKAGE_FILE);
    let metadata_path = app_data.join(TAURI_UPDATE_METADATA_FILE);
    let metadata =
        std::fs::read(&metadata_path).map_err(|e| format!("read Tauri update metadata: {e}"))?;
    let metadata: PendingTauriUpdate =
        serde_json::from_slice(&metadata).map_err(|e| format!("parse metadata: {e}"))?;
    let bytes =
        std::fs::read(&package_path).map_err(|e| format!("read Tauri update package: {e}"))?;
    verify_tauri_update_signature(&bytes, &metadata.signature)?;

    let update = build_tauri_update(
        app_handle,
        &metadata.manifest_url,
        &metadata.target,
        proxy_url,
    )
    .await?;
    if update.version != metadata.version {
        return Err("Pending Tauri update metadata does not match the current manifest.".into());
    }
    if update.target != metadata.target
        || update.download_url.to_string() != metadata.download_url
        || update.signature != metadata.signature
    {
        return Err("Pending Tauri update package does not match the current manifest.".into());
    }

    update
        .install(bytes)
        .map_err(|e| format!("install Tauri update: {e}"))?;
    let _ = std::fs::remove_file(&package_path);
    let _ = std::fs::remove_file(&metadata_path);
    Ok(())
}
