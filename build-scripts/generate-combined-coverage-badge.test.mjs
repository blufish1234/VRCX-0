import { describe, expect, it } from 'vitest';

import { createCombinedCoverageBadge } from './generate-combined-coverage-badge.mjs';

describe('combined coverage badge generation', () => {
    it('combines TypeScript and Rust line coverage by covered and total lines', () => {
        const badge = createCombinedCoverageBadge(
            {
                total: {
                    lines: {
                        total: 100,
                        covered: 90,
                        pct: 90
                    }
                }
            },
            {
                data: [
                    {
                        totals: {
                            lines: {
                                count: 900,
                                covered: 10,
                                percent: 1.1
                            }
                        }
                    }
                ]
            }
        );

        expect(badge).toEqual({
            schemaVersion: 1,
            label: 'coverage',
            message: '10.0%',
            color: 'red'
        });
    });

    it('uses the existing badge color thresholds for the combined percentage', () => {
        const badge = createCombinedCoverageBadge(
            {
                total: {
                    lines: {
                        total: 100,
                        covered: 70,
                        pct: 70
                    }
                }
            },
            {
                data: [
                    {
                        totals: {
                            lines: {
                                count: 100,
                                covered: 50,
                                percent: 50
                            }
                        }
                    }
                ]
            }
        );

        expect(badge).toEqual({
            schemaVersion: 1,
            label: 'coverage',
            message: '60.0%',
            color: 'yellow'
        });
    });
});
