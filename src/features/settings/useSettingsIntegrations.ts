import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { languageCodes } from '@/localization/index';
import configRepository from '@/repositories/configRepository';
import externalApiRepository from '@/repositories/externalApiRepository';
import {
    setDiscordBoolPreference,
    setTranslationApiConfigPreference,
    setYoutubeApiKeyPreference
} from '@/services/preferencesService';
import { normalizeDeepLTargetLanguage } from '@/services/translationService';
import {
    normalizeTranslationApiType,
    type DiscordPreferenceKey
} from '@/state/preferencesStore';

import {
    buildOpenAiModelsEndpoint,
    DEFAULT_TRANSLATION_ENDPOINT,
    DEFAULT_TRANSLATION_MODEL,
    parseWebJson
} from './settingsValues';

export type SettingsIntegrationPrefs = {
    youtubeAPI: boolean;
    youtubeAPIKey: string;
    translationAPI: boolean;
    bioLanguage: string;
    translationAPIType: string;
    translationAPIKey: string;
    translationAPIEndpoint: string;
    translationAPIModel: string;
    translationAPIPrompt: string;
    [key: string]: unknown;
};

export type SettingsDiscordPrefs = {
    discordActive: boolean;
    discordInstance: boolean;
    discordHideInvite: boolean;
    discordJoinButton: boolean;
    discordHideImage: boolean;
    discordShowPlatform: boolean;
    discordWorldIntegration: boolean;
    discordWorldNameAsDiscordStatus: boolean;
    [key: string]: unknown;
};

type SettingsIntegrationStatus = {
    youtube: string;
    translation: string;
    models: string;
    [key: string]: unknown;
};

type SettingsTranslationDraft = {
    bioLanguage: string;
    translationAPIType: string;
    translationAPIKey: string;
    translationAPIEndpoint: string;
    translationAPIModel: string;
    translationAPIPrompt: string;
    [key: string]: unknown;
};

type PreferenceAction = () => unknown | Promise<unknown>;
type PreferenceRollback = void | (() => void);
type SettingsIntegrationsDeps = {
    commit: (
        action: PreferenceAction,
        optimistic?: () => PreferenceRollback
    ) => Promise<boolean>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value && typeof value === 'object');
}

function readModelId(model: unknown): string | null {
    if (!isRecord(model)) {
        return null;
    }
    return typeof model.id === 'string' && model.id ? model.id : null;
}

function readModelIdOrName(model: unknown): string | null {
    if (!isRecord(model)) {
        return null;
    }
    const value = model.id || model.name;
    return typeof value === 'string' && value ? value : null;
}

function readTranslationModelNames(payload: unknown): string[] {
    if (isRecord(payload) && Array.isArray(payload.data)) {
        return payload.data
            .map(readModelId)
            .filter((modelName): modelName is string => Boolean(modelName))
            .sort();
    }
    if (Array.isArray(payload)) {
        return payload
            .map(readModelIdOrName)
            .filter((modelName): modelName is string => Boolean(modelName))
            .sort();
    }
    return [];
}

export function useSettingsIntegrations({ commit }: SettingsIntegrationsDeps) {
    const { t } = useTranslation();
    const [integrationPrefs, setIntegrationPrefs] =
        useState<SettingsIntegrationPrefs>({
            youtubeAPI: false,
            youtubeAPIKey: '',
            translationAPI: false,
            bioLanguage: 'en',
            translationAPIType: 'google',
            translationAPIKey: '',
            translationAPIEndpoint: DEFAULT_TRANSLATION_ENDPOINT,
            translationAPIModel: DEFAULT_TRANSLATION_MODEL,
            translationAPIPrompt: ''
        });
    const [discordPrefs, setDiscordPrefs] = useState<SettingsDiscordPrefs>({
        discordActive: false,
        discordInstance: true,
        discordHideInvite: true,
        discordJoinButton: false,
        discordHideImage: false,
        discordShowPlatform: true,
        discordWorldIntegration: true,
        discordWorldNameAsDiscordStatus: false
    });
    const [availableTranslationModels, setAvailableTranslationModels] =
        useState<string[]>([]);
    const [integrationStatus, setIntegrationStatus] =
        useState<SettingsIntegrationStatus>({
            youtube: 'idle',
            translation: 'idle',
            models: 'idle'
        });
    const [youtubeApiDialogOpen, setYoutubeApiDialogOpen] = useState(false);
    const [youtubeApiKeyDraft, setYoutubeApiKeyDraft] = useState('');
    const [translationApiDialogOpen, setTranslationApiDialogOpen] =
        useState(false);
    const [translationDraft, setTranslationDraft] =
        useState<SettingsTranslationDraft>({
            bioLanguage: 'en',
            translationAPIType: 'google',
            translationAPIKey: '',
            translationAPIEndpoint: DEFAULT_TRANSLATION_ENDPOINT,
            translationAPIModel: DEFAULT_TRANSLATION_MODEL,
            translationAPIPrompt: ''
        });

    useEffect(() => {
        let active = true;
        Promise.all([
            configRepository.getString('youtubeAPIKey', ''),
            configRepository.getString('translationAPIKey', '')
        ])
            .then(([youtubeAPIKey, translationAPIKey]) => {
                if (!active) {
                    return;
                }
                setIntegrationPrefs((current) => ({
                    ...current,
                    youtubeAPIKey: youtubeAPIKey || '',
                    translationAPIKey: translationAPIKey || ''
                }));
            })
            .catch(() => {});
        return () => {
            active = false;
        };
    }, []);

    function setIntegrationValue(
        key: keyof SettingsIntegrationPrefs,
        value: unknown
    ) {
        setIntegrationPrefs((current) => ({ ...current, [key]: value }));
    }

    function setTranslationDraftValue(
        key: keyof SettingsTranslationDraft,
        value: string
    ) {
        setTranslationDraft((current) => ({ ...current, [key]: value }));
    }

    function openYoutubeApiDialog() {
        setYoutubeApiKeyDraft(integrationPrefs.youtubeAPIKey || '');
        setYoutubeApiDialogOpen(true);
    }

    function openTranslationApiDialog() {
        setTranslationDraft({
            bioLanguage: integrationPrefs.bioLanguage || 'en',
            translationAPIType: normalizeTranslationApiType(
                integrationPrefs.translationAPIType
            ),
            translationAPIKey: integrationPrefs.translationAPIKey || '',
            translationAPIEndpoint:
                integrationPrefs.translationAPIEndpoint ||
                DEFAULT_TRANSLATION_ENDPOINT,
            translationAPIModel:
                integrationPrefs.translationAPIModel ||
                DEFAULT_TRANSLATION_MODEL,
            translationAPIPrompt: integrationPrefs.translationAPIPrompt || ''
        });
        setAvailableTranslationModels([]);
        setTranslationApiDialogOpen(true);
    }

    function setDiscordValue(key: DiscordPreferenceKey, value: boolean) {
        setDiscordPrefs((current) => ({ ...current, [key]: value }));
    }

    async function saveDiscordBoolPreference(
        key: DiscordPreferenceKey,
        value: boolean
    ) {
        await commit(
            () => setDiscordBoolPreference(key, value),
            () => {
                const previous = discordPrefs[key];
                setDiscordValue(key, value);
                return () => setDiscordValue(key, previous);
            }
        );
    }

    async function validateYoutubeApiKey(apiKey: string) {
        if (!apiKey) {
            return;
        }
        const response = await externalApiRepository.fetchYoutubeVideoMetadata({
            videoId: 'dQw4w9WgXcQ',
            apiKey
        });
        const payload = parseWebJson(response);
        const items = isRecord(payload) ? payload.items : null;
        if (
            response.status !== 200 ||
            !Array.isArray(items) ||
            items.length === 0
        ) {
            throw new Error(t('dialog.youtube_api.msg_test_failed'));
        }
    }

    async function saveYoutubeApiKey() {
        const apiKey = youtubeApiKeyDraft.trim();
        setIntegrationStatus((current) => ({
            ...current,
            youtube: 'running'
        }));
        try {
            await validateYoutubeApiKey(apiKey);
            await setYoutubeApiKeyPreference(apiKey);
            setIntegrationPrefs((current) => ({
                ...current,
                youtubeAPIKey: apiKey
            }));
            toast.success(
                apiKey
                    ? t('dialog.youtube_api.msg_settings_saved')
                    : t('dialog.youtube_api.msg_removed')
            );
            setYoutubeApiDialogOpen(false);
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : t('dialog.youtube_api.msg_test_failed')
            );
        } finally {
            setIntegrationStatus((current) => ({
                ...current,
                youtube: 'idle'
            }));
        }
    }

    async function saveTranslationApiConfig() {
        const nextType = normalizeTranslationApiType(
            translationDraft.translationAPIType
        );
        const nextEndpoint =
            translationDraft.translationAPIEndpoint.trim() ||
            DEFAULT_TRANSLATION_ENDPOINT;
        const nextModel =
            translationDraft.translationAPIModel.trim() ||
            DEFAULT_TRANSLATION_MODEL;
        const nextKey = translationDraft.translationAPIKey.trim();
        const nextBioLanguage = languageCodes.includes(
            translationDraft.bioLanguage
        )
            ? translationDraft.bioLanguage
            : 'en';
        if (nextType === 'openai' && (!nextEndpoint || !nextModel)) {
            toast.warning(t('dialog.translation_api.msg_fill_endpoint_model'));
            return;
        }

        setIntegrationStatus((current) => ({
            ...current,
            translation: 'running'
        }));
        try {
            const savedConfig = await setTranslationApiConfigPreference({
                bioLanguage: nextBioLanguage,
                translationAPIType: nextType,
                translationAPIKey: nextKey,
                translationAPIEndpoint: nextEndpoint,
                translationAPIModel: nextModel,
                translationAPIPrompt: translationDraft.translationAPIPrompt
            });
            setIntegrationPrefs((current) => ({
                ...current,
                ...savedConfig
            }));
            toast.success(t('dialog.translation_api.msg_settings_saved'));
            setTranslationApiDialogOpen(false);
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : t(
                          'view.settings.toast.failed_to_save_translation_settings'
                      )
            );
        } finally {
            setIntegrationStatus((current) => ({
                ...current,
                translation: 'idle'
            }));
        }
    }

    async function fetchTranslationModels() {
        const endpoint =
            translationDraft.translationAPIEndpoint.trim() ||
            DEFAULT_TRANSLATION_ENDPOINT;
        const headers: Record<string, string> = {};
        if (translationDraft.translationAPIKey.trim()) {
            headers.Authorization = `Bearer ${translationDraft.translationAPIKey.trim()}`;
        }

        setIntegrationStatus((current) => ({
            ...current,
            models: 'running'
        }));
        try {
            const response =
                await externalApiRepository.executeTranslationRequest({
                    url: buildOpenAiModelsEndpoint(endpoint),
                    method: 'GET',
                    headers
                });
            if (response.status !== 200) {
                throw new Error(`Failed to fetch models: ${response.status}`);
            }
            const payload = parseWebJson(response);
            const models = readTranslationModelNames(payload);
            setAvailableTranslationModels(models);
            if (models.length && !translationDraft.translationAPIModel.trim()) {
                setTranslationDraftValue('translationAPIModel', models[0]);
            }
            toast.success(
                models.length
                    ? t('dialog.translation_api.msg_models_fetched', {
                          count: models.length
                      })
                    : t('dialog.translation_api.msg_no_models_found')
            );
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : t(
                          'view.settings.toast.failed_to_fetch_translation_models'
                      )
            );
        } finally {
            setIntegrationStatus((current) => ({
                ...current,
                models: 'idle'
            }));
        }
    }

    async function testTranslationApiConfig() {
        const provider = normalizeTranslationApiType(
            translationDraft.translationAPIType
        );
        const apiKey = translationDraft.translationAPIKey.trim();
        setIntegrationStatus((current) => ({
            ...current,
            translation: 'running'
        }));
        try {
            if (provider === 'google') {
                if (!apiKey) {
                    toast.warning(t('dialog.translation_api.description'));
                    return;
                }
                const response =
                    await externalApiRepository.executeTranslationRequest({
                        url: `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`,
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            q: 'Hello world',
                            target: translationDraft.bioLanguage || 'en',
                            format: 'text'
                        })
                    });
                if (response.status !== 200) {
                    throw new Error(
                        t('dialog.translation_api.msg_test_failed')
                    );
                }
            } else if (provider === 'deepl') {
                if (!apiKey) {
                    toast.warning(t('dialog.translation_api.deepl.api_key'));
                    return;
                }
                const response =
                    await externalApiRepository.executeTranslationRequest({
                        url: 'https://api-free.deepl.com/v2/translate',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `DeepL-Auth-Key ${apiKey}`
                        },
                        body: JSON.stringify({
                            text: ['Hello world'],
                            target_lang: normalizeDeepLTargetLanguage(
                                translationDraft.bioLanguage || 'en'
                            )
                        })
                    });
                if (response.status !== 200) {
                    throw new Error(
                        t('dialog.translation_api.msg_test_failed')
                    );
                }
            } else {
                const endpoint =
                    translationDraft.translationAPIEndpoint.trim() ||
                    DEFAULT_TRANSLATION_ENDPOINT;
                const model =
                    translationDraft.translationAPIModel.trim() ||
                    DEFAULT_TRANSLATION_MODEL;
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json'
                };
                if (apiKey) {
                    headers.Authorization = `Bearer ${apiKey}`;
                }
                const response =
                    await externalApiRepository.executeTranslationRequest({
                        url: endpoint,
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            model,
                            messages: [
                                {
                                    role: 'system',
                                    content:
                                        translationDraft.translationAPIPrompt ||
                                        `Translate the user message into ${translationDraft.bioLanguage || 'en'}. Only return the translated text.`
                                },
                                { role: 'user', content: 'Hello world' }
                            ]
                        })
                    });
                if (response.status !== 200) {
                    throw new Error(
                        t('dialog.translation_api.msg_test_failed')
                    );
                }
            }
            toast.success(t('dialog.translation_api.msg_test_success'));
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : t('dialog.translation_api.msg_test_failed')
            );
        } finally {
            setIntegrationStatus((current) => ({
                ...current,
                translation: 'idle'
            }));
        }
    }

    return {
        availableTranslationModels,
        discordPrefs,
        fetchTranslationModels,
        integrationPrefs,
        integrationStatus,
        openTranslationApiDialog,
        openYoutubeApiDialog,
        saveDiscordBoolPreference,
        saveTranslationApiConfig,
        saveYoutubeApiKey,
        setDiscordPrefs,
        setIntegrationPrefs,
        setIntegrationValue,
        setTranslationApiDialogOpen,
        setTranslationDraftValue,
        setYoutubeApiDialogOpen,
        setYoutubeApiKeyDraft,
        testTranslationApiConfig,
        translationApiDialogOpen,
        translationDraft,
        youtubeApiDialogOpen,
        youtubeApiKeyDraft
    };
}
