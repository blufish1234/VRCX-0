import { handleAutoBackgroundDownloadUpdatesPreferenceChange } from '@/services/backgroundMaintenanceService';
import { useRuntimeStore } from '@/state/runtimeStore';

import { SettingsSystemTab } from './settings-tabs/SettingsSystemTab';

export function SettingsSystemSection({ system }: any) {
    const hostPlatform = useRuntimeStore(
        (state: any) => state.hostCapabilities.platform
    );
    const {
        prefs,
        savePreferenceValue,
        saveBoolPreference,
        setStartAtWindowsStartupPreference,
        setStartAsMinimizedPreference,
        setCloseToTrayPreference,
        promptProxySettings,
        promptAutoLoginDelaySeconds
    } = system;

    return (
        <SettingsSystemTab
            hostPlatform={hostPlatform}
            isStartAtWindowsStartup={prefs.isStartAtWindowsStartup}
            isStartAsMinimizedState={prefs.isStartAsMinimizedState}
            isCloseToTray={prefs.isCloseToTray}
            autoLoginDelayEnabled={prefs.autoLoginDelayEnabled}
            autoLoginDelaySeconds={prefs.autoLoginDelaySeconds}
            autoInstallUpdatesOnStartup={prefs.autoInstallUpdatesOnStartup}
            autoBackgroundDownloadUpdates={prefs.autoBackgroundDownloadUpdates}
            backgroundModeEnabled={prefs.backgroundModeEnabled}
            onStartAtWindowsStartupChange={(checked: any) => {
                savePreferenceValue('isStartAtWindowsStartup', checked, () =>
                    setStartAtWindowsStartupPreference(checked)
                );
            }}
            onStartAsMinimizedChange={(checked: any) => {
                savePreferenceValue('isStartAsMinimizedState', checked, () =>
                    setStartAsMinimizedPreference(checked)
                );
            }}
            onCloseToTrayChange={(checked: any) => {
                savePreferenceValue('isCloseToTray', checked, () =>
                    setCloseToTrayPreference(checked)
                );
            }}
            onAutoLoginDelayEnabledChange={(checked: any) => {
                saveBoolPreference(
                    'autoLoginDelayEnabled',
                    'autoLoginDelayEnabled',
                    checked
                );
            }}
            onBackgroundModeEnabledChange={(checked: any) => {
                saveBoolPreference(
                    'backgroundModeEnabled',
                    'backgroundModeEnabled',
                    checked
                );
            }}
            onAutoInstallUpdatesOnStartupChange={(checked: any) => {
                saveBoolPreference(
                    'autoInstallUpdatesOnStartup',
                    'autoInstallUpdatesOnStartup',
                    checked
                );
            }}
            onAutoBackgroundDownloadUpdatesChange={async (checked: any) => {
                await saveBoolPreference(
                    'autoBackgroundDownloadUpdates',
                    'autoBackgroundDownloadUpdates',
                    checked
                );
                await handleAutoBackgroundDownloadUpdatesPreferenceChange(
                    Boolean(checked)
                );
            }}
            onPromptAutoLoginDelaySeconds={() => {
                promptAutoLoginDelaySeconds();
            }}
            onProxySettings={() => {
                promptProxySettings();
            }}
        />
    );
}
