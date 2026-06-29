import { useEffect, useState } from 'react';

import { getFileAnalysisForUnityPackages } from '@/lib/fileAnalysis';
import {
    defaultWorldCacheInfo,
    readWorldCacheInfo
} from '@/lib/worldAssetBundle';
import vrchatAuthRepository from '@/repositories/vrchatAuthRepository';
import worldProfileRepository from '@/repositories/worldProfileRepository';
import { parseLocation } from '@/shared/utils/location';
import { normalizeString } from '@/shared/utils/string';
import { useModalStore } from '@/state/modalStore';
import { useRuntimeStore } from '@/state/runtimeStore';

import type { PlayerListContext } from '../playerListTypes';
import { CurrentWorldHeader } from './PlayerListViewParts';

type CurrentWorldProfile = Awaited<
    ReturnType<typeof worldProfileRepository.getWorldProfile>
>;
type CurrentWorldFileAnalysis = {
    android?: WorldFileAnalysisPlatform;
    standalonewindows?: WorldFileAnalysisPlatform;
    ios?: WorldFileAnalysisPlatform;
    [key: string]: WorldFileAnalysisPlatform | undefined;
};
type WorldFileAnalysisPlatform = {
    created_at?: string;
    encryptionKey?: string;
    fileSize?: number;
    success?: boolean;
    uncompressedSize?: number;
    worldSignature?: string;
    _fileSize?: string;
    _uncompressedSize?: string;
    [key: string]: unknown;
};

type PlayerListWorldHeaderProps = {
    clockNow: number;
    currentUserLocation?: unknown;
    friendCount: number;
    instanceSnapshot: PlayerListContext;
    isGameRunning: boolean;
    playerCount: number;
    startedAt?: unknown;
};

export function PlayerListWorldHeader({
    clockNow,
    currentUserLocation,
    friendCount,
    instanceSnapshot,
    isGameRunning,
    playerCount,
    startedAt
}: PlayerListWorldHeaderProps) {
    const currentUserEndpoint = useRuntimeStore(
        (state) => state.auth.currentUserEndpoint
    );
    const currentUserSnapshot = useRuntimeStore(
        (state) => state.auth.currentUserSnapshot
    );
    const openImagePreview = useModalStore((state) => state.openImagePreview);
    const parsedLocation = parseLocation(
        normalizeString(instanceSnapshot.location || currentUserLocation || '')
    );
    const [currentWorldProfile, setCurrentWorldProfile] =
        useState<CurrentWorldProfile | null>(null);
    const [currentWorldFileAnalysis, setCurrentWorldFileAnalysis] =
        useState<CurrentWorldFileAnalysis>({});
    const [currentWorldCacheInfo, setCurrentWorldCacheInfo] = useState(() =>
        defaultWorldCacheInfo()
    );

    useEffect(() => {
        let active = true;
        const worldId =
            parsedLocation.worldId || normalizeString(instanceSnapshot.worldId);

        if (!isGameRunning || !worldId) {
            setCurrentWorldProfile(null);
            setCurrentWorldFileAnalysis({});
            setCurrentWorldCacheInfo(defaultWorldCacheInfo());
            return () => {
                active = false;
            };
        }

        worldProfileRepository
            .getWorldProfile({
                worldId,
                endpoint: currentUserEndpoint,
                full: true
            })
            .then((world) => {
                if (active) {
                    setCurrentWorldProfile(world);
                }
                return vrchatAuthRepository
                    .getConfig({ endpoint: currentUserEndpoint })
                    .catch((): null => null)
                    .then((configResponse) => {
                        const sdkUnityVersion = String(
                            configResponse?.json?.sdkUnityVersion || ''
                        );
                        return Promise.all([
                            getFileAnalysisForUnityPackages({
                                unityPackages: world?.unityPackages,
                                sdkUnityVersion,
                                endpoint: currentUserEndpoint
                            }),
                            readWorldCacheInfo(
                                world,
                                currentUserEndpoint,
                                sdkUnityVersion
                            )
                        ]);
                    });
            })
            .then(([fileAnalysis, cacheInfo]) => {
                if (active) {
                    setCurrentWorldFileAnalysis(
                        (fileAnalysis || {}) as CurrentWorldFileAnalysis
                    );
                    setCurrentWorldCacheInfo(
                        cacheInfo || defaultWorldCacheInfo()
                    );
                }
            })
            .catch(() => {
                if (active) {
                    setCurrentWorldProfile(null);
                    setCurrentWorldFileAnalysis({});
                    setCurrentWorldCacheInfo(defaultWorldCacheInfo());
                }
            });

        return () => {
            active = false;
        };
    }, [
        currentUserEndpoint,
        instanceSnapshot.worldId,
        isGameRunning,
        parsedLocation.worldId
    ]);

    return (
        <CurrentWorldHeader
            cacheInfo={currentWorldCacheInfo}
            clockNow={clockNow}
            currentUserSnapshot={currentUserSnapshot}
            fileAnalysis={currentWorldFileAnalysis}
            friendCount={friendCount}
            instanceCreatedAt={instanceSnapshot.createdAt}
            instanceGroupName={normalizeString(instanceSnapshot.groupName)}
            instanceLocation={normalizeString(instanceSnapshot.location)}
            instanceWorldId={normalizeString(instanceSnapshot.worldId)}
            instanceWorldName={normalizeString(instanceSnapshot.worldName)}
            isGameRunning={isGameRunning}
            onPreviewImage={openImagePreview}
            playerCount={playerCount}
            parsedLocation={parsedLocation}
            startedAt={startedAt}
            world={currentWorldProfile}
        />
    );
}
