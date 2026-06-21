import { describe, expect, it } from 'vitest';

import {
    isNewInstanceOpenInGameRequest,
    isNewInstanceSelfInviteRequest,
    resolveNewInstanceAfterCreateAction
} from './useWorldInstanceActions';

describe('useWorldInstanceActions helpers', () => {
    it('maps the follow-up new-instance action to open in-game while VRChat is running', () => {
        expect(resolveNewInstanceAfterCreateAction(true, true)).toBe(
            'openInGame'
        );
        expect(
            isNewInstanceOpenInGameRequest({ afterCreateAction: 'openInGame' })
        ).toBe(true);
        expect(
            isNewInstanceSelfInviteRequest({ afterCreateAction: 'openInGame' })
        ).toBe(false);
    });

    it('keeps the follow-up new-instance action as self-invite when VRChat is not running', () => {
        expect(resolveNewInstanceAfterCreateAction(true, false)).toBe(
            'selfInvite'
        );
        expect(
            isNewInstanceSelfInviteRequest({ afterCreateAction: 'selfInvite' })
        ).toBe(true);
        expect(
            isNewInstanceOpenInGameRequest({ afterCreateAction: 'selfInvite' })
        ).toBe(false);
    });

    it('does not attach a follow-up action for a plain new instance', () => {
        expect(resolveNewInstanceAfterCreateAction(false, true)).toBe('');
        expect(isNewInstanceSelfInviteRequest(null)).toBe(false);
        expect(isNewInstanceOpenInGameRequest({})).toBe(false);
    });
});
