import type {
    CommunityThemeCatalog,
    CommunityThemeInstallMetadata,
    CommunityThemeManifest
} from '@/features/community-themes/communityThemeTypes';
import { tauriClient } from '@/platform/tauri/client';
import {
    COMMUNITY_THEME_CATALOG_URL,
    COMMUNITY_THEME_CSS_FILE_NAME,
    loadCommunityThemeCatalog,
    loadCommunityThemeCss,
    normalizeCommunityThemeCatalogUrl,
    resolveCommunityThemeAssetUrl
} from '@/repositories/communityThemeRepository';
import configRepository from '@/repositories/configRepository';
import {
    communityThemeControlsAccent,
    useCommunityThemeStore
} from '@/state/communityThemeStore';

import {
    applyThemeColor,
    clearThemeColorInlineProperties,
    resolveThemeColor
} from './themeService';

const INSTALLED_THEME_LAYER = 'installed-theme';
const USER_OVERRIDE_LAYER = 'user-override';
const COMMUNITY_THEME_STYLE_ATTR = 'data-vrcx-0-css-layer';
const COMMUNITY_THEME_ACCENT_ATTR = 'data-vrcx-0-community-theme-accent';

const CONFIG_KEYS = {
    catalogUrl: 'VRCX_themeMarketplaceCatalogUrl',
    enabled: 'VRCX_communityThemeEnabled',
    id: 'VRCX_communityThemeId',
    version: 'VRCX_communityThemeVersion',
    cssSnapshot: 'VRCX_communityThemeCssSnapshot',
    overrideCss: 'VRCX_communityThemeOverrideCss',
    installMetadata: 'VRCX_communityThemeInstallMetadata'
};

let installedThemeCssSnapshot = '';
let overrideCssSnapshot = '';

async function refreshCommunityThemeTrayMenu(): Promise<void> {
    try {
        await tauriClient.app.RefreshTrayMenu();
    } catch (error) {
        console.warn('Unable to refresh community theme tray menu:', error);
    }
}

function currentTimestamp(): string {
    return new Date().toISOString();
}

function ensureCommunityStyleLayer(layer: string, cssText: string): void {
    const styleElement = document.createElement('style');
    styleElement.setAttribute(COMMUNITY_THEME_STYLE_ATTR, layer);
    styleElement.textContent = cssText;
    document.head.appendChild(styleElement);
}

function syncCommunityStyleLayers(): void {
    if (typeof document === 'undefined') {
        return;
    }

    document
        .querySelectorAll(`style[${COMMUNITY_THEME_STYLE_ATTR}]`)
        .forEach((styleElement: any) => styleElement.remove());

    if (installedThemeCssSnapshot.trim()) {
        ensureCommunityStyleLayer(
            INSTALLED_THEME_LAYER,
            installedThemeCssSnapshot
        );
    }
    if (overrideCssSnapshot.trim()) {
        ensureCommunityStyleLayer(USER_OVERRIDE_LAYER, overrideCssSnapshot);
    }
}

async function applySavedThemeColor(): Promise<void> {
    const savedThemeColor = await configRepository.getString(
        'VRCX_themeColor',
        'default'
    );
    applyThemeColor(resolveThemeColor(savedThemeColor));
}

async function syncCommunityThemeAccentControl(): Promise<void> {
    if (typeof document === 'undefined') {
        return;
    }

    const { enabled, installedTheme } = useCommunityThemeStore.getState();
    const controlsAccent = communityThemeControlsAccent(enabled, installedTheme);
    const root = document.documentElement;
    if (controlsAccent) {
        root.setAttribute(COMMUNITY_THEME_ACCENT_ATTR, 'theme');
        clearThemeColorInlineProperties();
        return;
    }

    root.removeAttribute(COMMUNITY_THEME_ACCENT_ATTR);
    await applySavedThemeColor();
}

async function sha256Hex(value: string): Promise<string> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
        let hash = 0;
        for (let index = 0; index < value.length; index += 1) {
            hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
        }
        return hash.toString(16).padStart(8, '0');
    }

    const data = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(digest)]
        .map((byte: any) => byte.toString(16).padStart(2, '0'))
        .join('');
}

function normalizeInstallMetadata(
    value: unknown
): CommunityThemeInstallMetadata | null {
    if (!value || typeof value !== 'object') {
        return null;
    }
    const entry = value as Record<string, unknown>;
    if (!entry.themeId || !entry.themeName || !entry.version) {
        return null;
    }
    return {
        themeId: String(entry.themeId),
        themeName: String(entry.themeName),
        version: String(entry.version),
        sourceUrl: String(entry.sourceUrl || ''),
        sha256: String(entry.sha256 || ''),
        installedAt: String(entry.installedAt || ''),
        updatedAt: String(entry.updatedAt || ''),
        accentMode: entry.accentMode === 'app' ? 'app' : 'theme'
    };
}

export async function loadCatalog(): Promise<CommunityThemeCatalog> {
    const store = useCommunityThemeStore.getState();
    store.setLoading(true);
    store.setError(null);
    try {
        const catalogUrl = await configRepository.getString(
            CONFIG_KEYS.catalogUrl,
            COMMUNITY_THEME_CATALOG_URL
        );
        const normalizedCatalogUrl =
            normalizeCommunityThemeCatalogUrl(catalogUrl);
        const catalog = await loadCommunityThemeCatalog(normalizedCatalogUrl);
        store.setCatalog(catalog.sourceUrl, catalog.themes);
        return catalog;
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : 'Failed to load community themes.';
        store.setError(message);
        throw error;
    } finally {
        store.setLoading(false);
    }
}

export async function initializeCommunityThemes(): Promise<void> {
    const [catalogUrl, enabled, metadata, cssSnapshot, overrideCss] =
        await Promise.all([
            configRepository.getString(
                CONFIG_KEYS.catalogUrl,
                COMMUNITY_THEME_CATALOG_URL
            ),
            configRepository.getBool(CONFIG_KEYS.enabled, false),
            configRepository.getObject(CONFIG_KEYS.installMetadata, null),
            configRepository.getString(CONFIG_KEYS.cssSnapshot, ''),
            configRepository.getString(CONFIG_KEYS.overrideCss, '')
        ]);

    const installedTheme = normalizeInstallMetadata(metadata);
    const normalizedCatalogUrl = normalizeCommunityThemeCatalogUrl(catalogUrl);
    installedThemeCssSnapshot =
        enabled && installedTheme ? String(cssSnapshot || '') : '';
    overrideCssSnapshot = String(overrideCss || '');

    useCommunityThemeStore.getState().hydrate({
        catalogUrl: normalizedCatalogUrl,
        enabled: Boolean(enabled && installedTheme),
        installedTheme,
        overrideCssLength: overrideCssSnapshot.length
    });
    syncCommunityStyleLayers();
    await syncCommunityThemeAccentControl();
    await refreshCommunityThemeTrayMenu();
}

export async function installCommunityTheme(
    theme: CommunityThemeManifest
): Promise<CommunityThemeInstallMetadata> {
    const store = useCommunityThemeStore.getState();
    store.setLoading(true);
    store.setError(null);
    try {
        const catalogUrl = normalizeCommunityThemeCatalogUrl(
            store.catalogUrl || COMMUNITY_THEME_CATALOG_URL
        );
        const cssText = await loadCommunityThemeCss(catalogUrl, theme);
        const now = currentTimestamp();
        const previous = store.installedTheme;
        const metadata: CommunityThemeInstallMetadata = {
            themeId: theme.id,
            themeName: theme.name,
            version: theme.version,
            sourceUrl: resolveCommunityThemeAssetUrl(
                catalogUrl,
                theme.id,
                COMMUNITY_THEME_CSS_FILE_NAME
            ),
            sha256: await sha256Hex(cssText),
            installedAt:
                previous?.themeId === theme.id && previous.installedAt
                    ? previous.installedAt
                    : now,
            updatedAt: now,
            accentMode: theme.accentMode === 'app' ? 'app' : 'theme'
        };

        installedThemeCssSnapshot = cssText;
        await configRepository.setMany([
            [CONFIG_KEYS.catalogUrl, catalogUrl],
            [CONFIG_KEYS.enabled, 'true'],
            [CONFIG_KEYS.id, metadata.themeId],
            [CONFIG_KEYS.version, metadata.version],
            [CONFIG_KEYS.cssSnapshot, cssText],
            [CONFIG_KEYS.installMetadata, JSON.stringify(metadata)]
        ]);
        store.setInstalledState({
            enabled: true,
            installedTheme: metadata
        });
        syncCommunityStyleLayers();
        await syncCommunityThemeAccentControl();
        await refreshCommunityThemeTrayMenu();
        return metadata;
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : 'Failed to install community theme.';
        store.setError(message);
        throw error;
    } finally {
        store.setLoading(false);
    }
}

export async function enableInstalledCommunityTheme(): Promise<void> {
    const store = useCommunityThemeStore.getState();
    if (!store.installedTheme) {
        return;
    }
    const cssSnapshot = await configRepository.getString(
        CONFIG_KEYS.cssSnapshot,
        ''
    );
    installedThemeCssSnapshot = String(cssSnapshot || '');
    await configRepository.setBool(CONFIG_KEYS.enabled, true);
    store.setInstalledState({
        enabled: true,
        installedTheme: store.installedTheme
    });
    syncCommunityStyleLayers();
    await syncCommunityThemeAccentControl();
    await refreshCommunityThemeTrayMenu();
}

export async function disableInstalledCommunityTheme(): Promise<void> {
    const store = useCommunityThemeStore.getState();
    installedThemeCssSnapshot = '';
    await configRepository.setBool(CONFIG_KEYS.enabled, false);
    store.setInstalledState({
        enabled: false,
        installedTheme: store.installedTheme
    });
    syncCommunityStyleLayers();
    await syncCommunityThemeAccentControl();
    await refreshCommunityThemeTrayMenu();
}

export async function deleteInstalledCommunityTheme(): Promise<void> {
    const store = useCommunityThemeStore.getState();
    installedThemeCssSnapshot = '';
    await configRepository.setBool(CONFIG_KEYS.enabled, false);
    await Promise.all([
        configRepository.remove(CONFIG_KEYS.id),
        configRepository.remove(CONFIG_KEYS.version),
        configRepository.remove(CONFIG_KEYS.cssSnapshot),
        configRepository.remove(CONFIG_KEYS.installMetadata)
    ]);
    store.setInstalledState({
        enabled: false,
        installedTheme: null
    });
    syncCommunityStyleLayers();
    await syncCommunityThemeAccentControl();
    await refreshCommunityThemeTrayMenu();
}

export async function saveCommunityThemeOverrideCss(
    cssText: string
): Promise<void> {
    overrideCssSnapshot = String(cssText || '');
    await configRepository.setString(CONFIG_KEYS.overrideCss, overrideCssSnapshot);
    useCommunityThemeStore
        .getState()
        .setOverrideCssLength(overrideCssSnapshot.length);
    syncCommunityStyleLayers();
}

export async function clearCommunityThemeOverrideCss(): Promise<void> {
    await saveCommunityThemeOverrideCss('');
}

export function getCommunityThemeOverrideCssSnapshot(): string {
    return overrideCssSnapshot;
}

export function isCommunityThemeAccentControlled(): boolean {
    const state = useCommunityThemeStore.getState();
    return communityThemeControlsAccent(state.enabled, state.installedTheme);
}
