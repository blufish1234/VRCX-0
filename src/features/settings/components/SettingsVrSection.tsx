import type { SettingsPageStateSections } from '../settingsPageStateSections';
import { normalizeCheckedState } from '../settingsValues';
import { SettingsVrTab } from './settings-tabs/SettingsVrTab';

type SettingsVrSectionProps = {
    vr: SettingsPageStateSections['vr'];
};

export function SettingsVrSection({ vr }: SettingsVrSectionProps) {
    const {
        prefs,
        setVrNotificationsDialogOpen,
        setWristFeedNotificationsDialogOpen,
        savePreferenceValue,
        saveStringPreference,
        saveBoolPreference,
        setIntConfigPreference,
        saveWristOverlayEnabled
    } = vr;

    const saveNotificationTimeoutSeconds = (value: unknown) => {
        const seconds = Number.parseInt(String(value), 10);
        const milliseconds = Number.isFinite(seconds)
            ? Math.min(600000, Math.max(0, seconds * 1000))
            : 3000;
        savePreferenceValue('notificationTimeout', milliseconds, () =>
            setIntConfigPreference('notificationTimeout', milliseconds, {
                min: 0,
                max: 600000,
                fallback: 3000
            })
        );
    };

    const saveNotificationOpacity = (value: unknown) => {
        const opacity = Number.isFinite(Number(value))
            ? Math.min(100, Math.max(0, Math.round(Number(value))))
            : 100;
        savePreferenceValue('notificationOpacity', opacity, () =>
            setIntConfigPreference('notificationOpacity', opacity, {
                min: 0,
                max: 100,
                fallback: 100
            })
        );
    };

    return (
        <SettingsVrTab
            prefs={prefs}
            onXsNotificationsChange={(checked: unknown) => {
                const enabled = normalizeCheckedState(checked);
                saveBoolPreference(
                    'xsNotifications',
                    'xsNotifications',
                    enabled
                );
            }}
            onOvrtHudNotificationsChange={(checked: unknown) => {
                const enabled = normalizeCheckedState(checked);
                saveBoolPreference(
                    'ovrtHudNotifications',
                    'ovrtHudNotifications',
                    enabled
                );
            }}
            onOvrtWristNotificationsChange={(checked: unknown) => {
                const enabled = normalizeCheckedState(checked);
                saveBoolPreference(
                    'ovrtWristNotifications',
                    'ovrtWristNotifications',
                    enabled
                );
            }}
            onImageNotificationsChange={(checked: unknown) => {
                const enabled = normalizeCheckedState(checked);
                saveBoolPreference(
                    'imageNotifications',
                    'imageNotifications',
                    enabled
                );
            }}
            onNotificationTimeoutSecondsChange={saveNotificationTimeoutSeconds}
            onNotificationOpacityChange={saveNotificationOpacity}
            onOpenVrNotificationFiltersDialog={() =>
                setVrNotificationsDialogOpen(true)
            }
            onWristOverlayEnabledChange={(checked: unknown) =>
                saveWristOverlayEnabled(normalizeCheckedState(checked))
            }
            onWristOverlayStartModeChange={(value: string) => {
                saveStringPreference(
                    'wristOverlayStartMode',
                    'wristOverlayStartMode',
                    value
                );
            }}
            onWristOverlayButtonChange={(value: string) => {
                saveStringPreference(
                    'wristOverlayButton',
                    'wristOverlayButton',
                    value
                );
            }}
            onWristOverlayHandChange={(value: string) => {
                saveStringPreference(
                    'wristOverlayHand',
                    'wristOverlayHand',
                    value
                );
            }}
            onWristOverlaySizeChange={(value: string) => {
                saveStringPreference(
                    'wristOverlaySize',
                    'wristOverlaySize',
                    value
                );
            }}
            onWristOverlayDarkBackgroundChange={(checked: unknown) => {
                const enabled = normalizeCheckedState(checked);
                saveBoolPreference(
                    'wristOverlayDarkBackground',
                    'wristOverlayDarkBackground',
                    enabled
                );
            }}
            onWristOverlayHidePrivateWorldsChange={(checked: unknown) => {
                const enabled = normalizeCheckedState(checked);
                saveBoolPreference(
                    'wristOverlayHidePrivateWorlds',
                    'wristOverlayHidePrivateWorlds',
                    enabled
                );
            }}
            onWristOverlayShowDevicesChange={(checked: unknown) => {
                const enabled = normalizeCheckedState(checked);
                saveBoolPreference(
                    'wristOverlayShowDevices',
                    'wristOverlayShowDevices',
                    enabled
                );
            }}
            onWristOverlayShowBatteryPercentChange={(checked: unknown) => {
                const enabled = normalizeCheckedState(checked);
                saveBoolPreference(
                    'wristOverlayShowBatteryPercent',
                    'wristOverlayShowBatteryPercent',
                    enabled
                );
            }}
            onOpenWristFeedNotificationsDialog={() =>
                setWristFeedNotificationsDialogOpen(true)
            }
        />
    );
}
