use std::path::PathBuf;

use crate::domain::vrchat_paths;
use crate::error::AppError;

pub fn quit_game() -> i32 {
    use sysinfo::System;
    let mut sys = System::new();
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    let mut count = 0i32;
    for process in sys.processes().values() {
        if process
            .name()
            .to_string_lossy()
            .eq_ignore_ascii_case("VRChat.exe")
        {
            process.kill();
            count += 1;
        }
    }
    count
}

pub fn start_game(arguments: &str) -> Result<bool, AppError> {
    #[cfg(target_os = "linux")]
    {
        return start_game_linux(arguments);
    }

    #[cfg(target_os = "windows")]
    {
        start_game_windows(arguments)
    }

    #[cfg(target_os = "macos")]
    {
        Err(AppError::Custom(
            "Game launch is not supported on macOS".into(),
        ))
    }

    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    {
        Err(AppError::Custom(format!(
            "Game launch is not supported on {}",
            crate::domain::host_capabilities::current_platform()
        )))
    }
}

pub fn start_game_from_path(path: &str, arguments: &str) -> Result<bool, AppError> {
    #[cfg(target_os = "linux")]
    {
        let steam_sh = PathBuf::from(path).join("steam.sh");
        if !steam_sh.is_file() {
            return Ok(false);
        }

        spawn_steam_app_launch(steam_sh, arguments)?;
        return Ok(true);
    }

    #[cfg(target_os = "windows")]
    {
        let launch_exe = PathBuf::from(path).join("launch.exe");
        if !launch_exe.exists() {
            return Ok(false);
        }

        let mut cmd = std::process::Command::new(launch_exe);
        if !arguments.is_empty() {
            cmd.args(arguments.split_whitespace());
        }
        cmd.spawn()
            .map_err(|e| AppError::Custom(format!("start game: {e}")))?;

        Ok(true)
    }

    #[cfg(target_os = "macos")]
    {
        Err(AppError::Custom(
            "Game launch is not supported on macOS".into(),
        ))
    }

    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    {
        Err(AppError::Custom(format!(
            "Game launch is not supported on {}",
            crate::domain::host_capabilities::current_platform()
        )))
    }
}

#[cfg(target_os = "windows")]
fn start_game_windows(arguments: &str) -> Result<bool, AppError> {
    let steam_path = vrchat_paths::steam_path();
    if steam_path.is_empty() {
        return Ok(false);
    }
    let steam_exe = PathBuf::from(&steam_path).join("steam.exe");
    if !steam_exe.exists() {
        return Ok(false);
    }

    let mut args = vec!["-applaunch".to_string(), "438100".to_string()];
    if !arguments.is_empty() {
        args.extend(arguments.split_whitespace().map(|s| s.to_string()));
    }

    std::process::Command::new(steam_exe)
        .args(&args)
        .spawn()
        .map_err(|e| AppError::Custom(format!("start game: {e}")))?;

    Ok(true)
}

#[cfg(target_os = "linux")]
fn start_game_linux(arguments: &str) -> Result<bool, AppError> {
    if spawn_steam_app_launch(PathBuf::from("steam"), arguments).is_ok() {
        return Ok(true);
    }

    for steam_sh in vrchat_paths::linux_steam_sh_candidates() {
        if spawn_steam_app_launch(steam_sh, arguments).is_ok() {
            return Ok(true);
        }
    }

    Ok(false)
}

#[cfg(target_os = "linux")]
fn spawn_steam_app_launch(program: PathBuf, arguments: &str) -> Result<(), AppError> {
    let mut args = vec!["-applaunch".to_string(), "438100".to_string()];
    if !arguments.is_empty() {
        args.extend(arguments.split_whitespace().map(|s| s.to_string()));
    }

    std::process::Command::new(program)
        .args(&args)
        .spawn()
        .map_err(|e| AppError::Custom(format!("start game: {e}")))?;

    Ok(())
}
