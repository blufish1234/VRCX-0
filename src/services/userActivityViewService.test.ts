import { describe, expect, it } from 'vitest';

import {
    pickActivityNormalizeConfig,
    pickOverlapNormalizeConfig
} from './userActivityViewService';

describe('userActivityViewService normalize config helpers', () => {
    it('selects activity normalize configs for supported ranges', () => {
        expect(pickActivityNormalizeConfig(true, 7)).toEqual({
            floorPercentile: 10,
            capPercentile: 80,
            rankWeight: 0.15,
            targetCoverage: 0.12,
            targetVolume: 40
        });
        expect(pickActivityNormalizeConfig(true, 30)).toEqual({
            floorPercentile: 15,
            capPercentile: 85,
            rankWeight: 0.2,
            targetCoverage: 0.25,
            targetVolume: 60
        });
        expect(pickActivityNormalizeConfig(false, 90)).toEqual({
            floorPercentile: 15,
            capPercentile: 85,
            rankWeight: 0.2,
            targetCoverage: 0.3,
            targetVolume: 50
        });
    });

    it('falls back activity normalize configs by viewed user ownership', () => {
        expect(pickActivityNormalizeConfig(true, 365)).toEqual({
            floorPercentile: 15,
            capPercentile: 85,
            rankWeight: 0.2,
            targetCoverage: 0.25,
            targetVolume: 60
        });
        expect(pickActivityNormalizeConfig(false, 365)).toEqual({
            floorPercentile: 15,
            capPercentile: 85,
            rankWeight: 0.2,
            targetCoverage: 0.2,
            targetVolume: 35
        });
    });

    it('selects overlap normalize configs for supported ranges', () => {
        expect(pickOverlapNormalizeConfig(7)).toEqual({
            floorPercentile: 10,
            capPercentile: 80,
            rankWeight: 0.15,
            targetCoverage: 0.08,
            targetVolume: 15
        });
        expect(pickOverlapNormalizeConfig(30)).toEqual({
            floorPercentile: 15,
            capPercentile: 85,
            rankWeight: 0.2,
            targetCoverage: 0.15,
            targetVolume: 25
        });
        expect(pickOverlapNormalizeConfig(90)).toEqual({
            floorPercentile: 15,
            capPercentile: 85,
            rankWeight: 0.2,
            targetCoverage: 0.18,
            targetVolume: 20
        });
    });

    it('falls back overlap normalize configs for unsupported ranges', () => {
        expect(pickOverlapNormalizeConfig(365)).toEqual({
            floorPercentile: 15,
            capPercentile: 85,
            rankWeight: 0.2,
            targetCoverage: 0.15,
            targetVolume: 25
        });
    });
});
