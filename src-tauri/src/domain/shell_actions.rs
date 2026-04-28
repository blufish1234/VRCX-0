use std::path::{Path, PathBuf};

use base64::{engine::general_purpose::STANDARD as B64, Engine};

use crate::domain::vrchat_paths;
use crate::error::AppError;

pub fn open_link(url: &str) -> Result<(), AppError> {
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err(AppError::Custom("Invalid URL scheme".into()));
    }
    open::that(url).map_err(|e| AppError::Custom(format!("open link: {e}")))
}

pub fn open_discord_profile(discord_id: &str) -> Result<(), AppError> {
    let url = format!("discord://-/users/{discord_id}");
    open::that(&url).map_err(|e| AppError::Custom(format!("open discord: {e}")))
}

pub fn file_base64(path: &str) -> Result<String, AppError> {
    let bytes = std::fs::read(path)?;
    Ok(B64.encode(&bytes))
}

pub fn file_bytes(path: &str) -> Result<Vec<u8>, AppError> {
    Ok(std::fs::read(path)?)
}

pub fn read_config_file() -> Result<String, AppError> {
    let path = vrchat_paths::vrchat_config_path();
    if !path.exists() {
        return Ok(String::new());
    }
    Ok(std::fs::read_to_string(&path)?)
}

pub fn read_config_file_safe() -> Result<String, AppError> {
    let content = read_config_file()?;

    match serde_json::from_str::<serde_json::Value>(&content) {
        Ok(v) => Ok(serde_json::to_string_pretty(&v).unwrap_or_default()),
        Err(_) => Ok(String::new()),
    }
}

pub fn write_config_file(json: &str) -> Result<(), AppError> {
    let path = vrchat_paths::vrchat_config_path();
    write_string_file(&path, json)
}

pub fn open_existing_folder(path: &Path) -> Result<bool, AppError> {
    if !path.exists() {
        return Ok(false);
    }
    open::that(path.to_string_lossy().as_ref())
        .map_err(|e| AppError::Custom(format!("open folder: {e}")))?;
    Ok(true)
}

pub fn open_vrc_app_data_folder() -> Result<bool, AppError> {
    open_existing_folder(&vrchat_paths::vrchat_app_data())
}

pub fn open_vrc_photos_folder() -> Result<bool, AppError> {
    let path = vrchat_paths::vrchat_photos_location();
    open_existing_folder(Path::new(&path))
}

pub fn open_ugc_photos_folder(ugc_path: Option<String>) -> Result<bool, AppError> {
    let path = vrchat_paths::ugc_photo_location(ugc_path);
    open_existing_folder(Path::new(&path))
}

pub fn open_vrc_screenshots_folder() -> Result<bool, AppError> {
    let path = vrchat_paths::vrchat_screenshots_location();
    if path.is_empty() {
        return Ok(false);
    }
    open_existing_folder(Path::new(&path))
}

pub fn open_crash_dumps_folder() -> Result<bool, AppError> {
    open_existing_folder(&vrchat_paths::vrchat_crashes_location())
}

pub fn open_shortcut_folder(app_data: &Path) -> Result<(), AppError> {
    let shortcut_dir = app_data.join("Shortcuts");
    std::fs::create_dir_all(&shortcut_dir)?;
    open::that(shortcut_dir.to_string_lossy().as_ref())
        .map_err(|e| AppError::Custom(format!("open shortcut folder: {e}")))?;
    Ok(())
}

pub fn open_folder_and_select_item(path: &str, is_folder: bool) -> Result<(), AppError> {
    let p = PathBuf::from(path);
    if !p.exists() {
        return Err(AppError::Custom(format!("path not found: {path}")));
    }

    #[cfg(target_os = "linux")]
    {
        return open_folder_and_select_item_linux(&p, is_folder);
    }

    #[cfg(not(target_os = "linux"))]
    {
        let _ = is_folder;
        std::process::Command::new("explorer.exe")
            .arg("/select,")
            .arg(path)
            .spawn()
            .map_err(|e| AppError::Custom(format!("explorer: {e}")))?;

        Ok(())
    }
}

pub fn write_string_file(path: &Path, content: &str) -> Result<(), AppError> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::write(path, content)?;
    Ok(())
}

#[cfg(target_os = "linux")]
fn open_folder_and_select_item_linux(path: &Path, is_folder: bool) -> Result<(), AppError> {
    let directory = if is_folder {
        path
    } else {
        path.parent().unwrap_or(path)
    };

    let path_arg = path.as_os_str().to_os_string();
    let directory_arg = directory.as_os_str().to_os_string();
    let attempts: Vec<(&str, Vec<std::ffi::OsString>)> = vec![
        ("nautilus", vec![path_arg.clone()]),
        ("nemo", vec![path_arg.clone()]),
        ("thunar", vec![path_arg.clone()]),
        ("caja", vec!["--select".into(), path_arg.clone()]),
        ("pcmanfm-qt", vec![directory_arg.clone()]),
        ("pcmanfm", vec![directory_arg.clone()]),
        ("dolphin", vec!["--select".into(), path_arg.clone()]),
        ("konqueror", vec!["--select".into(), path_arg.clone()]),
        ("xdg-open", vec![directory_arg]),
    ];

    for (command, args) in attempts {
        if !vrchat_paths::linux_command_in_path(command) {
            continue;
        }

        if std::process::Command::new(command)
            .args(args)
            .spawn()
            .is_ok()
        {
            return Ok(());
        }
    }

    Err(AppError::Custom(
        "No supported Linux file manager was found".into(),
    ))
}
