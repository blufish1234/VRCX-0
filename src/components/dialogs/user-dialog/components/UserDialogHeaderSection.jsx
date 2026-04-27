import { CopyIcon, PencilIcon, UsersIcon } from 'lucide-react';
import { isValidElement } from 'react';

import { userFacingErrorMessage } from '@/lib/errorDisplay.js';
import { userImage } from '@/lib/entityMedia.js';
import { cn } from '@/lib/utils.js';
import { Button } from '@/ui/shadcn/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from '@/ui/shadcn/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/ui/shadcn/dropdown-menu';
import { Separator } from '@/ui/shadcn/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/shadcn/tooltip';

import {
    PreviousDisplayNamesBadge,
    UserTitleLanguages
} from '../UserDialogViewParts.jsx';
import { UserDialogHeaderActions } from './UserDialogHeaderActions.jsx';
import {
    UserDialogHeaderBadges,
    UserDialogHeaderMediaBadges
} from './UserDialogHeaderBadges.jsx';

function preferenceLabel(value, t) {
    return value
        ? t('dialog.user.info.avatar_cloning_allow')
        : t('dialog.user.info.avatar_cloning_deny');
}

function HeaderFactRow({ label, value, children }) {
    return (
        <div className="flex min-w-0 items-center justify-between gap-2">
            <span className="text-muted-foreground min-w-0 truncate">
                {label}
            </span>
            {children || (
                <span className="text-muted-foreground/80 min-w-0 truncate text-right">
                    {value || '\u2014'}
                </span>
            )}
        </div>
    );
}

function compactUserId(userId) {
    if (!userId || userId.length <= 18) {
        return userId || '';
    }
    return `${userId.slice(0, 12)}\u2026${userId.slice(-4)}`;
}

function UserDialogHeaderFacts({
    isCurrentUser,
    onCopyDisplayName,
    onCopyUserId,
    onCopyUserUrl,
    profile,
    t,
    userUrl
}) {
    return (
        <div className="text-muted-foreground/80 flex min-w-0 flex-col gap-1 border-t pt-3 text-xs">
            <HeaderFactRow
                label={t('dialog.user.info.avatar_cloning')}
                value={preferenceLabel(Boolean(profile.allowAvatarCopying), t)}
            />
            {isCurrentUser ? (
                <>
                    <HeaderFactRow
                        label={t('dialog.user.info.booping')}
                        value={preferenceLabel(
                            profile.isBoopingEnabled !== false,
                            t
                        )}
                    />
                    <HeaderFactRow
                        label={t('dialog.user.info.show_mutual_friends')}
                        value={preferenceLabel(
                            !profile.hasSharedConnectionsOptOut,
                            t
                        )}
                    />
                    <HeaderFactRow
                        label={t('dialog.user.info.show_discord_connections')}
                        value={preferenceLabel(
                            !profile.hasDiscordFriendsOptOut,
                            t
                        )}
                    />
                </>
            ) : null}
            {profile.id ? (
                <HeaderFactRow label={t('dialog.user.info.id')}>
                    <span className="flex min-w-0 items-center justify-end gap-1">
                        <span
                            className="text-muted-foreground/80 min-w-0 truncate font-mono text-[11px]"
                            title={profile.id}
                        >
                            {compactUserId(profile.id)}
                        </span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    aria-label={t('dialog.user.info.id_tooltip')}
                                    size="icon-xs"
                                    variant="ghost"
                                >
                                    <CopyIcon data-icon="inline-start" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuGroup>
                                    <DropdownMenuItem onSelect={onCopyUserId}>
                                        {t('dialog.user.info.copy_id')}
                                    </DropdownMenuItem>
                                    {userUrl ? (
                                        <DropdownMenuItem onSelect={onCopyUserUrl}>
                                            {t('dialog.user.info.copy_url')}
                                        </DropdownMenuItem>
                                    ) : null}
                                    {profile.displayName ? (
                                        <DropdownMenuItem
                                            onSelect={onCopyDisplayName}
                                        >
                                            {t(
                                                'dialog.user.info.copy_display_name'
                                            )}
                                        </DropdownMenuItem>
                                    ) : null}
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </span>
                </HeaderFactRow>
            ) : null}
        </div>
    );
}

export function UserDialogHeaderSection({
    actionStatus,
    avatarOverrideState,
    canInviteFromCurrentLocation,
    currentAvatarTarget,
    currentUserBoopingEnabled,
    detail,
    extendedModerationState,
    fallbackAvatarTarget,
    friendNumber,
    friendRequestState,
    imageUrl,
    isCurrentUser,
    isFriend,
    loadStatus,
    moderationState,
    onAvatarOverride,
    onBoop,
    onCopyDisplayName,
    onCopyUserId,
    onCopyUserUrl,
    onEditMemo,
    onEditSelfBio,
    onEditSelfBioLinks,
    onEditSelfLanguages,
    onEditSelfPronouns,
    onEditSelfStatus,
    onExtendedModeration,
    onFriendRequest,
    onGroupModeration,
    onImageClick,
    onInvite,
    onInviteMessage,
    onInviteRequest,
    onInviteRequestMessage,
    onInviteToGroup,
    onModeration,
    onOpenDiscordProfile,
    onOpenFallbackAvatar,
    onOpenImagePreview,
    onOpenUserIcon,
    onOpenUserUrl,
    onRefresh,
    onReportHacking,
    onShowAvatarAuthor,
    onShowInstanceHistory,
    onSubtitleClick,
    onTitleClick,
    onToggleBadgeShowcased,
    onToggleBadgeVisibility,
    onToggleSelfAvatarCopying,
    onToggleSelfBooping,
    onToggleSelfDiscordConnections,
    onToggleSelfSharedConnections,
    onUnfriend,
    platform,
    PlatformIcon,
    previousDisplayNames,
    previousInstances,
    profile,
    profileLanguages,
    profileTitle,
    pronounsText,
    recentDialogShortcut,
    statusIndicatorClassName,
    statusStateText,
    t,
    userSubtitle,
    userUrl
}) {
    const userIconUrl = profile.userIcon
        ? userImage(profile, true, '256', true)
        : '';
    const hasTitleMeta = Boolean(profileLanguages?.length);

    return (
        <Card
            size="sm"
            className="min-w-0 overflow-visible border shadow-none ring-0"
        >
            <CardHeader className="gap-3">
                <div className="relative">
                    <Button
                        type="button"
                        variant="ghost"
                        disabled={!imageUrl || !onImageClick}
                        onClick={onImageClick}
                        className={cn(
                            'bg-muted aspect-[4/3] h-auto w-full overflow-hidden rounded-lg border p-0 disabled:pointer-events-none',
                            imageUrl && onImageClick
                                ? 'cursor-pointer'
                                : 'cursor-default'
                        )}
                    >
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={profile.displayName || profile.id || 'User'}
                                className="size-full object-cover"
                            />
                        ) : (
                            <UsersIcon className="text-muted-foreground size-8" />
                        )}
                    </Button>
                    {userIconUrl ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    aria-label={t(
                                        'dialog.user.generated.open_user_icon'
                                    )}
                                    className="bg-background/90 absolute right-3 bottom-3 size-16 overflow-hidden rounded-full border-2 border-white p-0 shadow-md"
                                    onClick={onOpenUserIcon}
                                >
                                    <img
                                        src={userIconUrl}
                                        alt=""
                                        className="size-full object-cover"
                                    />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {t('dialog.user.generated.open_user_icon')}
                            </TooltipContent>
                        </Tooltip>
                    ) : null}
                </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-3">
                <div className="flex min-w-0 items-start gap-2">
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <CardTitle className="flex min-w-0 flex-wrap items-center gap-1.5 text-lg leading-tight">
                            {statusIndicatorClassName ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <i className={statusIndicatorClassName} />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {statusStateText || undefined}
                                    </TooltipContent>
                                </Tooltip>
                            ) : null}
                            {onTitleClick ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="hover:text-primary h-auto min-w-0 justify-start p-0 text-left text-lg leading-tight font-semibold break-words whitespace-normal"
                                    onClick={onTitleClick}
                                >
                                    {profileTitle}
                                </Button>
                            ) : (
                                <span className="min-w-0 break-words">
                                    {profileTitle}
                                </span>
                            )}
                            {pronounsText ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="text-muted-foreground shrink-0 font-mono text-xs font-normal">
                                            {pronounsText}
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {t('dialog.user.pronouns')}
                                    </TooltipContent>
                                </Tooltip>
                            ) : null}
                            <PreviousDisplayNamesBadge
                                names={previousDisplayNames}
                            />
                        </CardTitle>
                        {userSubtitle ? (
                            onSubtitleClick ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="text-muted-foreground hover:text-primary h-auto justify-start p-0 text-left font-mono text-xs break-all whitespace-normal"
                                    onClick={onSubtitleClick}
                                >
                                    {userSubtitle}
                                </Button>
                            ) : (
                                <div className="text-muted-foreground font-mono text-xs break-all">
                                    {userSubtitle}
                                </div>
                            )
                        ) : null}
                        {hasTitleMeta ? (
                            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                                <UserTitleLanguages languages={profileLanguages} />
                            </div>
                        ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <UserDialogHeaderActions
                            profile={profile}
                            loadStatus={loadStatus}
                            actionStatus={actionStatus}
                            moderationState={moderationState}
                            extendedModerationState={extendedModerationState}
                            avatarOverrideState={avatarOverrideState}
                            isCurrentUser={isCurrentUser}
                            isFriend={isFriend}
                            friendRequestState={friendRequestState}
                            canInviteFromCurrentLocation={
                                canInviteFromCurrentLocation
                            }
                            currentUserBoopingEnabled={
                                currentUserBoopingEnabled
                            }
                            currentAvatarTarget={currentAvatarTarget}
                            fallbackAvatarTarget={fallbackAvatarTarget}
                            previousInstances={previousInstances}
                            userUrl={userUrl}
                            recentDialogShortcut={recentDialogShortcut}
                            onRefresh={onRefresh}
                            onCopyUserUrl={onCopyUserUrl}
                            onOpenUserUrl={onOpenUserUrl}
                            onCopyUserId={onCopyUserId}
                            onEditMemo={onEditMemo}
                            onShowAvatarAuthor={onShowAvatarAuthor}
                            onOpenFallbackAvatar={onOpenFallbackAvatar}
                            onEditSelfStatus={onEditSelfStatus}
                            onEditSelfLanguages={onEditSelfLanguages}
                            onEditSelfBio={onEditSelfBio}
                            onEditSelfBioLinks={onEditSelfBioLinks}
                            onEditSelfPronouns={onEditSelfPronouns}
                            onToggleSelfAvatarCopying={
                                onToggleSelfAvatarCopying
                            }
                            onToggleSelfBooping={onToggleSelfBooping}
                            onToggleSelfSharedConnections={
                                onToggleSelfSharedConnections
                            }
                            onToggleSelfDiscordConnections={
                                onToggleSelfDiscordConnections
                            }
                            onFriendRequest={onFriendRequest}
                            onInvite={onInvite}
                            onInviteMessage={onInviteMessage}
                            onInviteRequest={onInviteRequest}
                            onInviteRequestMessage={onInviteRequestMessage}
                            onBoop={onBoop}
                            onUnfriend={onUnfriend}
                            onInviteToGroup={onInviteToGroup}
                            onGroupModeration={onGroupModeration}
                            onShowInstanceHistory={onShowInstanceHistory}
                            onModeration={onModeration}
                            onAvatarOverride={onAvatarOverride}
                            onExtendedModeration={onExtendedModeration}
                            onReportHacking={onReportHacking}
                            t={t}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                    <UserDialogHeaderBadges
                        profile={profile}
                        moderationState={moderationState}
                        friendNumber={friendNumber}
                        platform={platform}
                        PlatformIcon={PlatformIcon}
                        onOpenDiscordProfile={onOpenDiscordProfile}
                        t={t}
                    />
                </div>

                {profile.badges?.some((badge) => badge?.badgeImageUrl) ? (
                    <>
                        <Separator />
                        <div className="flex flex-wrap items-center gap-1.5">
                            <UserDialogHeaderMediaBadges
                                profile={profile}
                                profileTitle={profileTitle}
                                actionStatus={actionStatus}
                                isCurrentUser={isCurrentUser}
                                onOpenImagePreview={onOpenImagePreview}
                                onToggleBadgeVisibility={onToggleBadgeVisibility}
                                onToggleBadgeShowcased={onToggleBadgeShowcased}
                                t={t}
                            />
                        </div>
                    </>
                ) : null}

                {profile.statusDescription ? (
                    <>
                        <Separator />
                        <div className="text-muted-foreground flex max-h-24 min-w-0 items-start gap-2 overflow-auto text-sm whitespace-pre-wrap">
                            <PencilIcon
                                data-icon="inline-start"
                                className="mt-1 size-3 shrink-0"
                            />
                            <span className="min-w-0">
                                {profile.statusDescription}
                            </span>
                        </div>
                    </>
                ) : null}

                {detail ? (
                    <div className="text-muted-foreground text-xs">
                        {isValidElement(detail)
                            ? detail
                            : userFacingErrorMessage(
                                  detail,
                                  'The requested data could not be loaded.'
                              )}
                    </div>
                ) : null}

                <UserDialogHeaderFacts
                    isCurrentUser={isCurrentUser}
                    onCopyDisplayName={onCopyDisplayName}
                    onCopyUserId={onCopyUserId}
                    onCopyUserUrl={onCopyUserUrl}
                    profile={profile}
                    t={t}
                    userUrl={userUrl}
                />
            </CardContent>
        </Card>
    );
}
