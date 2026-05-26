import { PaletteIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useBackgroundImageStore } from '@/state/backgroundImageStore';
import { useCommunityThemeStore } from '@/state/communityThemeStore';
import { Button } from '@/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/shadcn/card';

export function SettingsInterfaceThemesCard() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const backgroundImageEnabled = useBackgroundImageStore(
        (state: any) => state.enabled
    );
    const communityThemeEnabled = useCommunityThemeStore(
        (state: any) => state.enabled
    );
    const installedTheme = useCommunityThemeStore(
        (state: any) => state.installedTheme
    );
    const localPreview = useCommunityThemeStore(
        (state: any) => state.localPreview
    );

    const sourceLabel = localPreview
        ? localPreview.themeName
        : communityThemeEnabled
          ? installedTheme?.themeName || t('view.themes.source.community')
          : backgroundImageEnabled
            ? t('view.themes.source.background')
            : t('view.themes.source.built_in');

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PaletteIcon data-icon="inline-start" />
                    {t('view.themes.settings.header')}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                <p className="text-muted-foreground text-sm">
                    {t('view.themes.settings.description')}
                </p>
                <p className="text-sm">
                    <span className="text-muted-foreground">
                        {t('view.themes.settings.current_source')}:{' '}
                    </span>
                    <span className="font-medium">{sourceLabel}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => navigate('/themes')}
                    >
                        <PaletteIcon data-icon="inline-start" />
                        {t('view.themes.action.open_themes')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
