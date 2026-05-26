import { PaletteIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/shadcn/card';

export function SettingsInterfaceCommunityThemesCard() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PaletteIcon data-icon="inline-start" />
                    {t('view.community_themes.settings.header')}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                <p className="text-muted-foreground text-sm">
                    {t('view.community_themes.settings.description')}
                </p>
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => navigate('/community-themes')}
                    >
                        <PaletteIcon data-icon="inline-start" />
                        {t('view.community_themes.action.open_marketplace')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
