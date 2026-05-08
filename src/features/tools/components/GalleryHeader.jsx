import {
    ArrowLeftIcon,
    PencilIcon,
    RefreshCwIcon,
    SettingsIcon
} from 'lucide-react';

import {
    PageHeader,
    PageTitle,
    PageToolbar,
    PageToolbarRow
} from '@/components/layout/PageScaffold.jsx';
import { IMAGE_UPLOAD_ACCEPT } from '@/shared/utils/imageUpload.js';
import { Badge } from '@/ui/shadcn/badge';
import { Button } from '@/ui/shadcn/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger
} from '@/ui/shadcn/dropdown-menu';
import { Field, FieldGroup, FieldLabel } from '@/ui/shadcn/field';
import { Input } from '@/ui/shadcn/input';
import { ToggleGroup, ToggleGroupItem } from '@/ui/shadcn/toggle-group';

import { GALLERY_GRID_DENSITY_OPTIONS } from '../galleryDensity.js';

function GalleryGridSettingsMenu({ t, gridDensity, onGridDensityChange }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={t('dialog.gallery_icons.grid_settings')}
                >
                    <SettingsIcon data-icon="inline-start" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 p-3" align="end">
                <FieldGroup>
                    <Field>
                        <FieldLabel>
                            {t('dialog.gallery_icons.grid_density')}
                        </FieldLabel>
                        <ToggleGroup
                            type="single"
                            variant="outline"
                            size="sm"
                            spacing={1}
                            value={gridDensity}
                            onValueChange={(nextValue) => {
                                if (nextValue) {
                                    onGridDensityChange(nextValue);
                                }
                            }}
                            className="grid w-full grid-cols-3"
                        >
                            {GALLERY_GRID_DENSITY_OPTIONS.map((option) => (
                                <ToggleGroupItem
                                    key={option.value}
                                    value={option.value}
                                    aria-label={t(option.labelKey)}
                                    className="w-full min-w-0 justify-center px-2"
                                >
                                    <span className="truncate">
                                        {t(option.labelKey)}
                                    </span>
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    </Field>
                </FieldGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function GalleryHeader({
    t,
    uploadInputRef,
    uploadingTab,
    onUploadChange,
    gridDensity,
    onGridDensityChange,
    onBack,
    onRefreshAll,
    onOpenProfileMedia
}) {
    return (
        <>
            <Input
                ref={uploadInputRef}
                type="file"
                accept={IMAGE_UPLOAD_ACCEPT}
                className="hidden"
                onChange={onUploadChange}
            />
            <PageToolbar>
                <PageToolbarRow className="items-start">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mr-1"
                        onClick={onBack}
                    >
                        <ArrowLeftIcon data-icon="inline-start" />
                        {t('nav_tooltip.tools')}
                    </Button>
                    <PageHeader className="min-w-0 p-0">
                        <PageTitle>{t('dialog.gallery_icons.header')}</PageTitle>
                    </PageHeader>
                    {uploadingTab ? (
                        <Badge variant="outline">
                            {t('message.upload.loading')} {uploadingTab}
                        </Badge>
                    ) : null}
                    <div className="ml-auto flex flex-wrap items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onOpenProfileMedia}
                        >
                            <PencilIcon data-icon="inline-start" />
                            {t('dialog.gallery_icons.edit_current_profile_media')}
                        </Button>
                        <GalleryGridSettingsMenu
                            t={t}
                            gridDensity={gridDensity}
                            onGridDensityChange={onGridDensityChange}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRefreshAll}
                        >
                            <RefreshCwIcon data-icon="inline-start" />
                            {t('dialog.gallery_icons.refresh')}
                        </Button>
                    </div>
                </PageToolbarRow>
            </PageToolbar>
        </>
    );
}
