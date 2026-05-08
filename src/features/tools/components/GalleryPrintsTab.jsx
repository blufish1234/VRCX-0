import {
    ImageIcon,
    RefreshCwIcon,
    SlidersHorizontalIcon,
    Trash2Icon,
    UploadIcon
} from 'lucide-react';

import { formatDateFilter } from '@/lib/dateTime.js';
import { getPrintFileName } from '@/shared/utils/gallery.js';
import { Button } from '@/ui/shadcn/button';
import { Checkbox } from '@/ui/shadcn/checkbox';
import { Field, FieldGroup, FieldLabel } from '@/ui/shadcn/field';
import { Input } from '@/ui/shadcn/input';
import {
    Popover,
    PopoverContent,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger
} from '@/ui/shadcn/popover';
import { TabsContent } from '@/ui/shadcn/tabs';

import { EmptyState, LoadingState } from './GalleryViewParts.jsx';
import { MediaAssetTile, shortAssetId } from './MediaAssetTile.jsx';
import { MediaLibraryToolbar } from './MediaLibraryToolbar.jsx';

export function GalleryPrintsTab({
    t,
    prints,
    loading,
    uploadingTab,
    mutatingKey,
    isVrcPlusSupporter,
    gridDensityConfig,
    printUploadNote,
    printCropBorder,
    onRefresh,
    onBeginUpload,
    onPrintUploadNoteChange,
    onPrintCropBorderChange,
    onPreview,
    onDeletePrint
}) {
    return (
        <TabsContent
            value="prints"
            className="mt-2 min-h-0 flex-1 data-[state=active]:flex data-[state=inactive]:hidden"
        >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <MediaLibraryToolbar
                    title={t('dialog.gallery_icons.prints')}
                    actions={
                        <>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <SlidersHorizontalIcon data-icon="inline-start" />
                                        {t(
                                            'dialog.gallery_icons.upload_options'
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent align="end" className="w-80">
                                    <PopoverHeader>
                                        <PopoverTitle>
                                            {t(
                                                'dialog.gallery_icons.upload_options'
                                            )}
                                        </PopoverTitle>
                                    </PopoverHeader>
                                    <FieldGroup>
                                        <Field>
                                            <FieldLabel htmlFor="gallery-print-upload-note">
                                                {t('dialog.gallery_icons.note')}
                                            </FieldLabel>
                                            <Input
                                                id="gallery-print-upload-note"
                                                maxLength={32}
                                                value={printUploadNote}
                                                onChange={(event) =>
                                                    onPrintUploadNoteChange(
                                                        event.target.value
                                                    )
                                                }
                                                placeholder={t(
                                                    'dialog.gallery_icons.note'
                                                )}
                                            />
                                        </Field>
                                        <Field
                                            orientation="horizontal"
                                            className="h-9 w-auto"
                                        >
                                            <Checkbox
                                                id="gallery-print-crop-border"
                                                checked={printCropBorder}
                                                onCheckedChange={(value) =>
                                                    onPrintCropBorderChange(
                                                        Boolean(value)
                                                    )
                                                }
                                            />
                                            <FieldLabel htmlFor="gallery-print-crop-border">
                                                {t(
                                                    'dialog.gallery_icons.crop_print_border'
                                                )}
                                            </FieldLabel>
                                        </Field>
                                    </FieldGroup>
                                </PopoverContent>
                            </Popover>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onRefresh('prints')}
                            >
                                <RefreshCwIcon data-icon="inline-start" />
                                {t('dialog.gallery_icons.refresh')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={
                                    !isVrcPlusSupporter || Boolean(uploadingTab)
                                }
                                onClick={() => onBeginUpload('prints')}
                            >
                                <UploadIcon data-icon="inline-start" />
                                {t('dialog.gallery_icons.upload')}
                            </Button>
                        </>
                    }
                />
                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                    {loading ? (
                        <LoadingState />
                    ) : prints.length > 0 ? (
                        <div className={gridDensityConfig.printsGridClass}>
                            {prints.map((print) => {
                                const imageUrl = print?.files?.image || '';
                                const isMutating =
                                    mutatingKey === `prints:${print.id}`;
                                const createdAt = print.createdAt
                                    ? formatDateFilter(print.createdAt, 'long')
                                    : '';

                                return (
                                    <MediaAssetTile
                                        key={print.id}
                                        title={print.note || shortAssetId(print.id)}
                                        subtitle={
                                            print.note
                                                ? getPrintFileName(print)
                                                : ''
                                        }
                                        meta={[
                                            print.worldName || print.worldId
                                                ? {
                                                      key: 'world',
                                                      label:
                                                          print.worldName ||
                                                          print.worldId
                                                  }
                                                : null,
                                            print.authorName || print.authorId
                                                ? {
                                                      key: 'author',
                                                      label:
                                                          print.authorName ||
                                                          print.authorId
                                                  }
                                                : null,
                                            createdAt
                                                ? {
                                                      key: 'createdAt',
                                                      label: createdAt
                                                  }
                                                : null
                                        ].filter(Boolean)}
                                        imageUrl={imageUrl}
                                        alt={print.note || print.id}
                                        aspectClass="aspect-[16/9]"
                                        imageFit="cover"
                                        placeholderIcon={ImageIcon}
                                        onPreview={() =>
                                            onPreview({
                                                id: print.id,
                                                url: imageUrl,
                                                title: getPrintFileName(print)
                                            })
                                        }
                                        menuLabel={t('aria.more')}
                                        menuActions={[
                                            {
                                                key: 'delete',
                                                label: t(
                                                    'common.actions.delete'
                                                ),
                                                icon: Trash2Icon,
                                                destructive: true,
                                                disabled: isMutating,
                                                onSelect: () =>
                                                    onDeletePrint(print.id)
                                            }
                                        ]}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState
                            title={t('view.tools.generated.no_prints_loaded')}
                            description={t(
                                'view.tools.generated.refresh_this_tab_to_load_your_vrchat_prints'
                            )}
                        />
                    )}
                </div>
            </div>
        </TabsContent>
    );
}
