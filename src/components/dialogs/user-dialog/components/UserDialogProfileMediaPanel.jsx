import {
    ArrowLeftIcon,
    ArrowRightIcon,
    CheckIcon,
    ImageIcon,
    RefreshCwIcon,
    XIcon
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { EmptyState, LoadingState } from '@/components/layout/PageScaffold.jsx';
import {
    convertFileUrlToImageUrl,
    userImage
} from '@/lib/entityMedia.js';
import { cn } from '@/lib/utils.js';
import { mediaRepository } from '@/repositories/index.js';
import { extractFileId } from '@/shared/utils/fileUtils.js';
import { useDialogStore } from '@/state/dialogStore.js';
import { Badge } from '@/ui/shadcn/badge';
import { Button } from '@/ui/shadcn/button';

const MEDIA_SECTIONS = [
    {
        key: 'banner',
        fieldName: 'profilePicOverride',
        fileTag: 'gallery',
        assetKey: 'gallery',
        galleryTab: 'gallery',
        titleKey: 'dialog.user.profile_media.banner',
        descriptionKey: 'dialog.user.profile_media.banner_description',
        clearKey: 'dialog.gallery_icons.clear_banner',
        useKey: 'dialog.gallery_icons.use_banner',
        manageKey: 'dialog.user.profile_media.manage_photo_gallery',
        aspectClass: 'aspect-[4/3]'
    },
    {
        key: 'profile-icon',
        fieldName: 'userIcon',
        fileTag: 'icon',
        assetKey: 'icons',
        galleryTab: 'icons',
        titleKey: 'dialog.user.profile_media.profile_icon',
        descriptionKey: 'dialog.user.profile_media.profile_icon_description',
        clearKey: 'dialog.gallery_icons.clear_profile_icon',
        useKey: 'dialog.gallery_icons.use_profile_icon',
        manageKey: 'dialog.user.profile_media.manage_profile_icon',
        aspectClass: 'aspect-square'
    }
];

function getLatestFileUrl(file) {
    const versions = Array.isArray(file?.versions) ? file.versions : [];
    return versions.at(-1)?.file?.url ?? '';
}

function getUsefulDisplayName(file) {
    const displayName = String(file?.displayName || '').trim();
    const name = String(file?.name || '').trim();
    const id = String(file?.id || '').trim();
    const visibleName = displayName || name;

    if (
        !visibleName ||
        visibleName === id ||
        /^file_[\w-]+_blob$/i.test(visibleName)
    ) {
        return '';
    }

    return visibleName;
}

function resolveCurrentImage(profile, section, endpoint) {
    if (section.fieldName === 'userIcon') {
        return profile?.userIcon
            ? convertFileUrlToImageUrl(profile.userIcon, 256, endpoint)
            : '';
    }
    return (
        convertFileUrlToImageUrl(
            profile?.profilePicOverride || '',
            256,
            endpoint
        ) || userImage(profile, false, '256')
    );
}

function ProfileMediaThumbnail({
    file,
    section,
    currentFileId,
    disabled,
    mutatingKey,
    onUse,
    t
}) {
    const imageUrl = getLatestFileUrl(file);
    const displayName = getUsefulDisplayName(file);
    const isCurrent = file.id === currentFileId;
    const isMutating =
        mutatingKey === `${section.fieldName}:${file.id}` ||
        mutatingKey === `${section.fieldName}:clear`;

    return (
        <Button
            type="button"
            variant="ghost"
            className={cn(
                'relative h-auto min-w-0 overflow-hidden rounded-lg border p-0',
                isCurrent && 'ring-primary ring-2'
            )}
            title={`${t(section.useKey)}: ${displayName || file.id}`}
            disabled={disabled || isMutating || isCurrent}
            onClick={() => onUse(section.fieldName, file.id)}
        >
            <div
                className={cn(
                    'bg-muted text-muted-foreground flex w-full items-center justify-center overflow-hidden',
                    section.aspectClass
                )}
            >
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={displayName || file.id}
                        loading="lazy"
                        className={cn(
                            'size-full',
                            section.fieldName === 'userIcon'
                                ? 'object-contain'
                                : 'object-cover'
                        )}
                    />
                ) : (
                    <ImageIcon />
                )}
            </div>
            {isCurrent ? (
                <Badge
                    variant="secondary"
                    className="absolute top-1 left-1 bg-background/80"
                >
                    <CheckIcon data-icon="inline-start" />
                    {t('dialog.gallery_icons.current')}
                </Badge>
            ) : null}
        </Button>
    );
}

function ProfileMediaSection({
    section,
    files,
    loading,
    profile,
    endpoint,
    isVrcPlusSupporter,
    busy,
    mutatingKey,
    onRefresh,
    onUse,
    onClear,
    onManage,
    t
}) {
    const currentValue = profile?.[section.fieldName] || '';
    const currentFileId = extractFileId(currentValue);
    const currentImage = resolveCurrentImage(profile, section, endpoint);

    return (
        <div className="bg-card/40 flex min-w-0 flex-col gap-3 rounded-lg border p-3">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex min-w-0 gap-3">
                    <div
                        className={cn(
                            'bg-muted text-muted-foreground flex w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border',
                            section.aspectClass
                        )}
                    >
                        {currentImage ? (
                            <img
                                src={currentImage}
                                alt=""
                                className={cn(
                                    'size-full',
                                    section.fieldName === 'userIcon'
                                        ? 'object-contain'
                                        : 'object-cover'
                                )}
                            />
                        ) : (
                            <ImageIcon />
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="font-heading text-base font-medium">
                            {t(section.titleKey)}
                        </div>
                        <div className="text-muted-foreground mt-1 max-w-2xl text-sm">
                            {t(section.descriptionKey)}
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRefresh(section)}
                    >
                        <RefreshCwIcon data-icon="inline-start" />
                        {t('dialog.gallery_icons.refresh')}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!isVrcPlusSupporter || !currentValue || busy}
                        onClick={() => onClear(section.fieldName)}
                    >
                        <XIcon data-icon="inline-start" />
                        {t(section.clearKey)}
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onManage(section)}
                    >
                        <ArrowRightIcon data-icon="inline-start" />
                        {t(section.manageKey)}
                    </Button>
                </div>
            </div>
            {loading ? (
                <LoadingState className="min-h-32" />
            ) : files.length ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">
                    {files.map((file) => (
                        <ProfileMediaThumbnail
                            key={file.id}
                            file={file}
                            section={section}
                            currentFileId={currentFileId}
                            disabled={
                                !isVrcPlusSupporter ||
                                busy ||
                                Boolean(mutatingKey)
                            }
                            mutatingKey={mutatingKey}
                            onUse={onUse}
                            t={t}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={ImageIcon}
                    className="min-h-32"
                    title={t('dialog.user.profile_media.empty_title')}
                    description={t('dialog.user.profile_media.empty_description')}
                />
            )}
        </div>
    );
}

export function UserDialogProfileMediaPanel({
    profile,
    endpoint,
    isVrcPlusSupporter,
    actionStatus,
    onBack,
    onSetProfileMediaField,
    t
}) {
    const navigate = useNavigate();
    const closeDialog = useDialogStore((state) => state.closeDialog);
    const [filesBySection, setFilesBySection] = useState({
        gallery: [],
        icons: []
    });
    const [loadingBySection, setLoadingBySection] = useState({});
    const [mutatingKey, setMutatingKey] = useState('');
    const busy = actionStatus !== 'idle';

    async function refreshSection(section) {
        setLoadingBySection((current) => ({
            ...current,
            [section.assetKey]: true
        }));
        try {
            const { json } = await mediaRepository.getFileList(
                {
                    n: 100,
                    tag: section.fileTag
                },
                {
                    endpoint
                }
            );
            setFilesBySection((current) => ({
                ...current,
                [section.assetKey]: Array.isArray(json)
                    ? [...json].reverse()
                    : []
            }));
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : t('view.tools.generated_toast.failed_to_load_value', {
                          value: section.fileTag
                      })
            );
        } finally {
            setLoadingBySection((current) => ({
                ...current,
                [section.assetKey]: false
            }));
        }
    }

    useEffect(() => {
        for (const section of MEDIA_SECTIONS) {
            void refreshSection(section);
        }
    }, [endpoint, profile?.id]);

    async function useProfileMedia(fieldName, fileId) {
        const key = `${fieldName}:${fileId}`;
        setMutatingKey(key);
        try {
            await onSetProfileMediaField(fieldName, fileId);
        } finally {
            setMutatingKey((current) => (current === key ? '' : current));
        }
    }

    async function clearProfileMedia(fieldName) {
        const key = `${fieldName}:clear`;
        setMutatingKey(key);
        try {
            await onSetProfileMediaField(fieldName, '');
        } finally {
            setMutatingKey((current) => (current === key ? '' : current));
        }
    }

    function manageInGallery(section) {
        closeDialog();
        navigate(`/tools/gallery?tab=${section.galleryTab}`);
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onBack}>
                    <ArrowLeftIcon data-icon="inline-start" />
                    {t('common.actions.back')}
                </Button>
                <div className="min-w-0">
                    <div className="font-heading text-lg font-medium">
                        {t('dialog.user.actions.edit_profile_media')}
                    </div>
                    <div className="text-muted-foreground text-sm">
                        {t('dialog.user.profile_media.description')}
                    </div>
                </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="flex flex-col gap-3">
                    {MEDIA_SECTIONS.map((section) => (
                        <ProfileMediaSection
                            key={section.key}
                            section={section}
                            files={filesBySection[section.assetKey] || []}
                            loading={loadingBySection[section.assetKey]}
                            profile={profile}
                            endpoint={endpoint}
                            isVrcPlusSupporter={isVrcPlusSupporter}
                            busy={busy}
                            mutatingKey={mutatingKey}
                            onRefresh={(nextSection) =>
                                void refreshSection(nextSection)
                            }
                            onUse={(fieldName, fileId) =>
                                void useProfileMedia(fieldName, fileId)
                            }
                            onClear={(fieldName) =>
                                void clearProfileMedia(fieldName)
                            }
                            onManage={manageInGallery}
                            t={t}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
