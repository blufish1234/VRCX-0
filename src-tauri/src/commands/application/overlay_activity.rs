#![allow(non_snake_case)]

use tauri::State;
use vrcx_0_application::OverlayActivitySnapshot;

use crate::error::AppError;
use crate::state::AppState;

#[tauri::command]
pub fn app__overlay_activity_snapshot_get(
    state: State<'_, AppState>,
) -> Result<OverlayActivitySnapshot, AppError> {
    Ok(state.overlay_activity_snapshot())
}
