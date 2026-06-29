import { useEffect, useState } from 'react';

import vrchatModerationRepository from '@/repositories/vrchatModerationRepository';
import { normalizeString } from '@/shared/utils/string';

type LocalModerationRow = Awaited<
    ReturnType<typeof vrchatModerationRepository.getAllLocalModerations>
>[number];

export function usePlayerListModeration(currentUserId: unknown) {
    const [moderationByUserId, setModerationByUserId] = useState<
        Record<string, LocalModerationRow>
    >({});

    useEffect(() => {
        let active = true;

        if (!currentUserId) {
            setModerationByUserId({});
            return () => {
                active = false;
            };
        }

        vrchatModerationRepository
            .getAllLocalModerations(currentUserId)
            .then((rows) => {
                if (!active) {
                    return;
                }

                setModerationByUserId(
                    Object.fromEntries(
                        (Array.isArray(rows) ? rows : [])
                            .filter((row) => normalizeString(row?.userId))
                            .map((row) => [normalizeString(row.userId), row])
                    )
                );
            })
            .catch(() => {
                if (active) {
                    setModerationByUserId({});
                }
            });

        return () => {
            active = false;
        };
    }, [currentUserId]);

    return moderationByUserId;
}
