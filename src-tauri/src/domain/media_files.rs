use std::path::PathBuf;

use base64::{engine::general_purpose::STANDARD as B64, Engine};
use fast_rsync::{Signature, SignatureOptions};

use crate::domain::image_cache::ImageCache;
use crate::domain::ugc_image_files;
use crate::error::AppError;

const MAX_IMAGE_SAVE_BYTES: usize = 100 * 1024 * 1024;

pub fn decode_image_file(
    default_name: &str,
    base64_data: &str,
) -> Result<(String, Vec<u8>), AppError> {
    let file_name = ugc_image_files::normalize_image_save_file_name(default_name)?;
    let bytes = B64
        .decode(base64_data.trim())
        .map_err(|e| AppError::Custom(format!("image base64 decode: {e}")))?;

    if bytes.is_empty() {
        return Err(AppError::Custom("image data is empty".into()));
    }

    if bytes.len() > MAX_IMAGE_SAVE_BYTES {
        return Err(AppError::Custom("image data is too large".into()));
    }

    Ok((file_name, bytes))
}

pub fn write_image_file(
    mut path: PathBuf,
    file_name: &str,
    bytes: &[u8],
) -> Result<String, AppError> {
    if path.extension().is_none() {
        path.set_extension(ugc_image_files::default_image_extension(file_name));
    }

    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    std::fs::write(&path, bytes)?;
    Ok(path.to_string_lossy().to_string())
}

pub fn sign_file_base64(blob: &str) -> Result<String, AppError> {
    let data = B64
        .decode(blob)
        .map_err(|e| AppError::Custom(format!("base64 decode: {e}")))?;
    let sig = Signature::calculate(
        &data,
        SignatureOptions {
            block_size: 2048,
            crypto_hash_size: 8,
        },
    );
    Ok(B64.encode(sig.serialized()))
}

pub async fn save_ugc_image_to_file(
    image_cache: &ImageCache,
    url: &str,
    ugc_folder_path: &str,
    month_folder: &str,
    file_name: &str,
) -> Result<String, AppError> {
    let out = ugc_image_files::build_ugc_image_path(ugc_folder_path, month_folder, file_name)?;
    if let Some(dir) = out.parent() {
        std::fs::create_dir_all(dir)?;
    }
    let out_str = out.to_string_lossy().into_owned();
    image_cache.save_image_to_file(url, &out_str).await?;
    Ok(out_str)
}
