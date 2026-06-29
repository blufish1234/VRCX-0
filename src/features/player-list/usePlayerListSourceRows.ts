import { useMemo } from 'react';

import { buildPlayerSourceRows } from './playerListRows';
import type {
    PlayerListContext,
    PlayerListProfileRecord,
    PlayerListSourceRow
} from './playerListTypes';

export function usePlayerListSourceRows({
    context,
    currentLocationStartedAt,
    currentUserId,
    currentUserLocation,
    currentUserSnapshot,
    isGameRunning,
    playerRows,
    runtimeRosterAvailable,
    runtimePlayerRows
}: {
    context: PlayerListContext;
    currentLocationStartedAt?: unknown;
    currentUserId?: unknown;
    currentUserLocation?: unknown;
    currentUserSnapshot?: PlayerListProfileRecord | null;
    isGameRunning: boolean;
    playerRows?: unknown;
    runtimeRosterAvailable?: boolean;
    runtimePlayerRows?: unknown;
}): PlayerListSourceRow[] {
    return useMemo(() => {
        return buildPlayerSourceRows({
            context,
            currentLocationStartedAt,
            currentUserId,
            currentUserLocation,
            currentUserSnapshot,
            isGameRunning,
            playerRows,
            runtimePlayerRows,
            runtimeRosterAvailable
        });
    }, [
        context,
        currentLocationStartedAt,
        currentUserId,
        currentUserLocation,
        currentUserSnapshot,
        isGameRunning,
        playerRows,
        runtimeRosterAvailable,
        runtimePlayerRows
    ]);
}
