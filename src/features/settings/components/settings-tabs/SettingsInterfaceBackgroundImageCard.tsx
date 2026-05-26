import {
    FolderOpenIcon,
    ImageIcon,
    ImagesIcon,
    RefreshCwIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
    backgroundImageRemoteProviders,
    chooseBackgroundImageFiles,
    chooseBackgroundImageFolder,
    refreshBackgroundImage,
    setBackgroundImageCustomRotationInterval,
    setBackgroundImageMode,
    setBackgroundImageProvider
} from '@/services/background-image/backgroundImageService';
import { isBackgroundImageCustomSourceRotating } from '@/services/background-image/localSourceService';
import type {
    BackgroundImageMode,
    BackgroundImageProviderId,
    BackgroundImageRotationInterval
} from '@/services/background-image/types';
import { useBackgroundImageStore } from '@/state/backgroundImageStore';
import { Button } from '@/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/shadcn/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/ui/shadcn/select';

import { Field } from '../SettingsField';

function countKey(baseKey: string, count: number): string {
    return count === 1 ? baseKey : `${baseKey}_plural`;
}

export function SettingsInterfaceBackgroundImageCard() {
    const { t } = useTranslation();
    const mode = useBackgroundImageStore((state: any) => state.mode);
    const enabled = useBackgroundImageStore((state: any) => state.enabled);
    const providerId = useBackgroundImageStore(
        (state: any) => state.providerId
    );
    const customSource = useBackgroundImageStore(
        (state: any) => state.customSource
    );
    const snapshot = useBackgroundImageStore((state: any) => state.snapshot);
    const loading = useBackgroundImageStore((state: any) => state.loading);
    const showRotation = isBackgroundImageCustomSourceRotating(
        customSource,
        snapshot?.imageCount
    );

    async function updateMode(nextMode: BackgroundImageMode) {
        try {
            const updated = await setBackgroundImageMode(nextMode);
            if (nextMode === 'off') {
                toast.success(t('view.background_image.toast.disabled'));
                return;
            }
            if (updated) {
                toast.success(t('view.background_image.toast.enabled'));
            }
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : t('view.background_image.toast.failed')
            );
        }
    }

    async function updateProvider(nextProviderId: BackgroundImageProviderId) {
        try {
            await setBackgroundImageProvider(nextProviderId);
            if (enabled && mode === 'daily') {
                toast.success(t('view.background_image.toast.enabled'));
                return;
            }
            toast.success(t('common.settings_saved'));
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : t('view.background_image.toast.failed')
            );
        }
    }

    async function refreshBackground() {
        try {
            const refreshed = await refreshBackgroundImage();
            if (!refreshed) {
                return;
            }
            toast.success(t('view.background_image.toast.refreshed'));
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : t('view.background_image.toast.failed')
            );
        }
    }

    async function selectFiles() {
        try {
            const selected = await chooseBackgroundImageFiles();
            if (selected) {
                toast.success(t('view.background_image.toast.enabled'));
            }
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : t('view.background_image.toast.no_images')
            );
        }
    }

    async function selectFolder() {
        try {
            const selected = await chooseBackgroundImageFolder();
            if (selected) {
                toast.success(t('view.background_image.toast.enabled'));
            }
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : t('view.background_image.toast.no_images')
            );
        }
    }

    async function updateRotationInterval(
        value: BackgroundImageRotationInterval
    ) {
        try {
            await setBackgroundImageCustomRotationInterval(value);
            toast.success(t('common.settings_saved'));
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : t('view.background_image.toast.failed')
            );
        }
    }

    const sourceLabel =
        customSource?.kind === 'folder'
            ? customSource.folderPath
            : customSource?.paths?.length
              ? t(
                    countKey(
                        'view.background_image.settings.selected_files',
                        customSource.paths.length
                    ),
                    {
                        count: customSource.paths.length
                    }
                )
              : t('view.background_image.settings.no_custom_source');

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ImageIcon data-icon="inline-start" />
                    {t('view.background_image.settings.header')}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col">
                <Field
                    label={t('view.background_image.settings.mode')}
                    description={t('view.background_image.settings.description')}
                >
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <Select
                            value={mode}
                            disabled={loading}
                            onValueChange={(value) =>
                                updateMode(value as BackgroundImageMode)
                            }
                        >
                            <SelectTrigger size="sm" className="min-w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="off">
                                    {t('view.background_image.mode.off')}
                                </SelectItem>
                                <SelectItem value="daily">
                                    {t('view.background_image.mode.daily')}
                                </SelectItem>
                                <SelectItem value="custom">
                                    {t('view.background_image.mode.custom')}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </Field>
                {mode === 'daily' ? (
                    <Field
                        label={t('view.background_image.settings.provider')}
                        description={
                            providerId === 'nasa-apod-safe'
                                ? t('view.background_image.settings.apod_note')
                                : undefined
                        }
                    >
                        <Select
                            value={providerId}
                            disabled={loading}
                            onValueChange={(value) =>
                                updateProvider(value as BackgroundImageProviderId)
                            }
                        >
                            <SelectTrigger size="sm" className="min-w-52">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {backgroundImageRemoteProviders.map(
                                    (provider) => (
                                        <SelectItem
                                            key={provider.id}
                                            value={provider.id}
                                        >
                                            {provider.name}
                                        </SelectItem>
                                    )
                                )}
                            </SelectContent>
                        </Select>
                    </Field>
                ) : null}
                {mode === 'custom' ? (
                    <>
                        <Field
                            label={t(
                                'view.background_image.settings.custom_source'
                            )}
                            description={t(
                                'view.background_image.settings.custom_source_description'
                            )}
                        >
                            <div className="flex min-w-0 flex-col gap-2">
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={loading}
                                        onClick={selectFiles}
                                    >
                                        <ImagesIcon data-icon="inline-start" />
                                        {t(
                                            'view.background_image.action.select_images'
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={loading}
                                        onClick={selectFolder}
                                    >
                                        <FolderOpenIcon data-icon="inline-start" />
                                        {t(
                                            'view.background_image.action.select_folder'
                                        )}
                                    </Button>
                                </div>
                                <span className="text-muted-foreground text-xs">
                                    {t(
                                        'view.background_image.settings.folder_first_level_note'
                                    )}
                                </span>
                            </div>
                        </Field>
                        <Field
                            label={t(
                                'view.background_image.settings.current_source'
                            )}
                        >
                            <span className="break-all text-sm">
                                {sourceLabel}
                            </span>
                        </Field>
                        {showRotation ? (
                            <Field
                                label={t(
                                    'view.background_image.settings.rotation'
                                )}
                            >
                                <Select
                                    value={
                                        customSource?.rotationInterval || 'daily'
                                    }
                                    disabled={loading}
                                    onValueChange={(value) =>
                                        updateRotationInterval(
                                            value as BackgroundImageRotationInterval
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        size="sm"
                                        className="min-w-36"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">
                                            {t(
                                                'view.background_image.rotation.daily'
                                            )}
                                        </SelectItem>
                                        <SelectItem value="hourly">
                                            {t(
                                                'view.background_image.rotation.hourly'
                                            )}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                        ) : null}
                    </>
                ) : null}
                {enabled && snapshot ? (
                    <Field label={t('view.background_image.settings.current_image')}>
                        <div className="text-sm">
                            <div className="font-medium">{snapshot.title}</div>
                            <div className="text-muted-foreground text-xs">
                                {snapshot.author} · {snapshot.license} ·{' '}
                                {snapshot.source}
                            </div>
                            {snapshot.imageCount ? (
                                <div className="text-muted-foreground text-xs">
                                    {t(
                                        countKey(
                                            'view.background_image.settings.image_count',
                                            snapshot.imageCount
                                        ),
                                        { count: snapshot.imageCount }
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </Field>
                ) : null}
                {enabled ? (
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={loading}
                            onClick={refreshBackground}
                        >
                            <RefreshCwIcon data-icon="inline-start" />
                            {t('view.background_image.action.refresh')}
                        </Button>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}
