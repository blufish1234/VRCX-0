import { handleAutoBackgroundDownloadUpdatesPreferenceChange } from '@/services/backgroundMaintenanceService';
import { useRuntimeStore } from '@/state/runtimeStore';

import type { SettingsPageStateSections } from '../settingsPageStateSections';
import { normalizeCheckedState } from '../settingsValues';
import { SettingsSystemTab } from './settings-tabs/SettingsSystemTab';

type SettingsSystemSectionProps = {
    system: SettingsPageStateSections['system'];
};

export function SettingsSystemSection({ system }: SettingsSystemSectionProps) {
    const hostPlatform = useRuntimeStore(
        (state) => state.hostCapabilities.platform
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
            onStartAtWindowsStartupChange={(checked: unknown) => {
                const enabled = normalizeCheckedState(checked);
                savePreferenceValue('isStartAtWindowsStartup', enabled, () =>
                    setStartAtWindowsStartupPreference(enabled)
                );
            }}
            onStartAsMinimizedChange={(checked: unknown) => {
                const enabled = normalizeCheckedState(checked);
                savePreferenceValue('isStartAsMinimizedState', enabled, () =>
                    setStartAsMinimizedPreference(enabled)
                );
            }}
            onCloseToTrayChange={(checked: unknown) => {
                const enabled = normalizeCheckedState(checked);
                savePreferenceValue('isCloseToTray', enabled, () =>
                    setCloseToTrayPreference(enabled)
                );
            }}
            onAutoLoginDelayEnabledChange={(checked: unknown) => {
                const enabled = normalizeCheckedState(checked);
                saveBoolPreference(
                    'autoLoginDelayEnabled',
                    'autoLoginDelayEnabled',
                    enabled
                );
            }}
            onBackgroundModeEnabledChange={(checked: unknown) => {
                const enabled = normalizeCheckedState(checked);
                saveBoolPreference(
                    'backgroundModeEnabled',
                    'backgroundModeEnabled',
                    enabled
                );
            }}
            onAutoInstallUpdatesOnStartupChange={(checked: unknown) => {
                const enabled = normalizeCheckedState(checked);
                saveBoolPreference(
                    'autoInstallUpdatesOnStartup',
                    'autoInstallUpdatesOnStartup',
                    enabled
                );
            }}
            onAutoBackgroundDownloadUpdatesChange={async (checked: unknown) => {
                const enabled = normalizeCheckedState(checked);
                await saveBoolPreference(
                    'autoBackgroundDownloadUpdates',
                    'autoBackgroundDownloadUpdates',
                    enabled
                );
                await handleAutoBackgroundDownloadUpdatesPreferenceChange(
                    enabled
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
