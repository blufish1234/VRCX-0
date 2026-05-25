import { BrushIcon, PaletteIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
    clearCommunityThemeOverrideCss,
    disableInstalledCommunityTheme
} from '@/services/communityThemeService';
import { useCommunityThemeStore } from '@/state/communityThemeStore';
import { Button } from '@/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/shadcn/card';

import { Field } from '../SettingsField';

export function SettingsInterfaceCommunityThemesCard() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const enabled = useCommunityThemeStore((state: any) => state.enabled);
    const installedTheme = useCommunityThemeStore(
        (state: any) => state.installedTheme
    );
    const overrideCssLength = useCommunityThemeStore(
        (state: any) => state.overrideCssLength
    );

    async function disableTheme() {
        try {
            await disableInstalledCommunityTheme();
            toast.success(t('view.community_themes.toast.theme_disabled'));
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : t('view.community_themes.toast.disable_failed')
            );
        }
    }

    async function clearOverride() {
        try {
            await clearCommunityThemeOverrideCss();
            toast.success(t('view.community_themes.toast.override_cleared'));
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : t('view.community_themes.toast.disable_failed')
            );
        }
    }

    const activeLabel =
        enabled && installedTheme
            ? installedTheme.themeName
            : t('view.community_themes.settings.status_default');

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PaletteIcon data-icon="inline-start" />
                    {t('view.community_themes.settings.header')}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col">
                <Field
                    label={t('view.community_themes.settings.current_theme')}
                    description={t(
                        'view.community_themes.settings.description'
                    )}
                >
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="text-sm">{activeLabel}</span>
                        {overrideCssLength ? (
                            <span className="text-muted-foreground text-xs">
                                {t(
                                    'view.community_themes.settings.override_active'
                                )}
                            </span>
                        ) : null}
                    </div>
                </Field>
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => navigate('/community-themes')}
                    >
                        <PaletteIcon data-icon="inline-start" />
                        {t('view.community_themes.action.open_marketplace')}
                    </Button>
                    {enabled ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={disableTheme}
                        >
                            <BrushIcon data-icon="inline-start" />
                            {t('view.community_themes.action.disable_theme')}
                        </Button>
                    ) : null}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!overrideCssLength}
                        onClick={clearOverride}
                    >
                        {t('view.community_themes.action.clear_override')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
