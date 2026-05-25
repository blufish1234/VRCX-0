export type CommunityThemeAccentMode = 'theme' | 'app';

export interface CommunityThemeAuthor {
    name: string;
    github: string;
    url?: string;
}

export interface CommunityThemeManifest {
    id: string;
    name: string;
    version: string;
    author: CommunityThemeAuthor;
    license: string;
    licenseUrl?: string;
    description: string;
    tags: string[];
    testedWith: string;
    remoteAssets: boolean;
    accentMode: CommunityThemeAccentMode;
    previewUrl: string;
    readmeUrl: string;
}

export interface CommunityThemeCatalog {
    sourceUrl: string;
    schemaVersion: number;
    themes: CommunityThemeManifest[];
}

export interface CommunityThemeInstallMetadata {
    themeId: string;
    themeName: string;
    version: string;
    sourceUrl: string;
    sha256: string;
    installedAt: string;
    updatedAt: string;
    accentMode: CommunityThemeAccentMode;
}
