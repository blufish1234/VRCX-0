import { MoreHorizontalIcon, ImageIcon } from 'lucide-react';

import { cn } from '@/lib/utils.js';
import { Badge } from '@/ui/shadcn/badge';
import { Button } from '@/ui/shadcn/button';
import { Card, CardContent } from '@/ui/shadcn/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/ui/shadcn/dropdown-menu';

export function shortAssetId(value) {
    const text = String(value || '').trim();
    if (!text) {
        return '';
    }
    if (text.length <= 18) {
        return text;
    }
    return `${text.slice(0, 10)}...${text.slice(-6)}`;
}

function renderIcon(Icon) {
    return Icon ? <Icon data-icon="inline-start" /> : null;
}

function TileActionsMenu({ actions, label }) {
    const visibleActions = (actions || []).filter(Boolean);
    if (!visibleActions.length) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="secondary"
                    size="icon-sm"
                    className="bg-background/70 backdrop-blur"
                    aria-label={label}
                >
                    <MoreHorizontalIcon data-icon="inline-start" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuGroup>
                    {visibleActions.map((action) => (
                        <DropdownMenuItem
                            key={action.key || action.label}
                            variant={
                                action.destructive ? 'destructive' : 'default'
                            }
                            disabled={action.disabled}
                            onSelect={(event) => {
                                event.preventDefault();
                                action.onSelect?.();
                            }}
                        >
                            {renderIcon(action.icon)}
                            {action.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function MediaAssetTile({
    title,
    subtitle,
    meta,
    badges,
    imageUrl,
    alt,
    aspectClass = 'aspect-square',
    imageFit = 'cover',
    isCurrent = false,
    currentLabel,
    menuLabel,
    placeholderIcon: PlaceholderIcon = ImageIcon,
    renderMedia,
    onPreview,
    primaryAction,
    menuActions,
    className,
    contentClassName
}) {
    const safeTitle = String(title || '').trim();
    const safeSubtitle = String(subtitle || '').trim();
    const safeMeta = (Array.isArray(meta) ? meta : [meta]).filter(Boolean);
    const safeBadges = (badges || []).filter(Boolean);
    const hasPrimaryAction = Boolean(primaryAction?.label);

    return (
        <Card
            size="sm"
            className={cn(
                'group/tile gap-0 overflow-hidden rounded-lg py-0 transition-colors',
                isCurrent && 'ring-primary ring-2',
                className
            )}
        >
            <div className="relative">
                <Button
                    type="button"
                    variant="ghost"
                    className="block h-auto w-full rounded-none p-0"
                    onClick={imageUrl || renderMedia ? onPreview : undefined}
                >
                    <div
                        className={cn(
                            'bg-muted/30 text-muted-foreground flex w-full items-center justify-center overflow-hidden',
                            aspectClass
                        )}
                    >
                        {renderMedia ? (
                            renderMedia({
                                className: cn(
                                    'size-full',
                                    imageFit === 'contain'
                                        ? 'object-contain'
                                        : 'object-cover'
                                )
                            })
                        ) : imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={alt || safeTitle}
                                loading="lazy"
                                className={cn(
                                    'size-full',
                                    imageFit === 'contain'
                                        ? 'object-contain'
                                        : 'object-cover'
                                )}
                            />
                        ) : (
                            <PlaceholderIcon className="size-8" />
                        )}
                    </div>
                </Button>
                <div className="pointer-events-none absolute top-2 left-2 flex flex-wrap gap-1">
                    {isCurrent && currentLabel ? (
                        <Badge variant="secondary" className="bg-background/80">
                            {currentLabel}
                        </Badge>
                    ) : null}
                    {safeBadges.map((badge) => (
                        <Badge
                            key={badge.key || badge.label}
                            variant={badge.variant || 'outline'}
                            className="bg-background/80"
                        >
                            {badge.label}
                        </Badge>
                    ))}
                </div>
                <div className="absolute top-2 right-2">
                    <TileActionsMenu actions={menuActions} label={menuLabel} />
                </div>
            </div>
            <CardContent
                className={cn(
                    'flex min-h-20 items-start gap-2 p-2.5',
                    contentClassName
                )}
            >
                <div className="min-w-0 flex-1">
                    {safeTitle ? (
                        <div
                            className="truncate text-sm font-medium"
                            title={safeTitle}
                        >
                            {safeTitle}
                        </div>
                    ) : null}
                    {safeSubtitle ? (
                        <div
                            className="text-muted-foreground truncate font-mono text-xs"
                            title={safeSubtitle}
                        >
                            {safeSubtitle}
                        </div>
                    ) : null}
                    {safeMeta.map((item) => (
                        <div
                            key={item.key || item.label || item}
                            className="text-muted-foreground truncate text-xs"
                            title={item.title || item.label || item}
                        >
                            {item.label || item}
                        </div>
                    ))}
                </div>
                {hasPrimaryAction ? (
                    <Button
                        type="button"
                        variant={primaryAction.variant || 'outline'}
                        size="sm"
                        className="shrink-0"
                        disabled={primaryAction.disabled}
                        onClick={primaryAction.onClick}
                    >
                        {renderIcon(primaryAction.icon)}
                        {primaryAction.label}
                    </Button>
                ) : null}
            </CardContent>
        </Card>
    );
}
