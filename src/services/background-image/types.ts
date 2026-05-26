export type BackgroundImageProviderId =
    | 'nasa-epic'
    | 'aic-public-domain'
    | 'nasa-apod-safe';

export type BackgroundImageMode = 'off' | 'daily' | 'custom';

export type BackgroundImageSnapshotMode = Exclude<BackgroundImageMode, 'off'>;

export type BackgroundImageCustomSourceKind = 'files' | 'folder';

export type BackgroundImageRotationInterval = 'daily' | 'hourly';

export interface BackgroundImageCredit {
    title: string;
    author: string;
    license: string;
    source: string;
}

export interface BackgroundImageSnapshot extends BackgroundImageCredit {
    mode: BackgroundImageSnapshotMode;
    providerId?: BackgroundImageProviderId;
    sourceKind?: BackgroundImageCustomSourceKind;
    imageUrl: string;
    imagePath?: string;
    imageCount?: number;
    resolvedAt: string;
    resolvedForKey: string;
}

export interface BackgroundImageCustomSource {
    kind: BackgroundImageCustomSourceKind;
    paths: string[];
    folderPath: string;
    rotationInterval: BackgroundImageRotationInterval;
}

export interface BackgroundImageProvider {
    id: BackgroundImageProviderId;
    name: string;
    priority: number;
    enabledByDefault: boolean;
    cacheTtlHours: number;
    resolveSnapshot(): Promise<BackgroundImageSnapshot>;
}
