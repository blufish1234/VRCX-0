import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

function requireNumber(value, label) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`Missing numeric coverage field: ${label}`);
    }
    return value;
}

function colorForPercentage(percentage) {
    if (percentage >= 80) {
        return 'brightgreen';
    }
    if (percentage >= 50) {
        return 'yellow';
    }
    return 'red';
}

export function createCombinedCoverageBadge(tsSummary, rustSummary) {
    const tsLines = tsSummary?.total?.lines;
    const rustLines = rustSummary?.data?.[0]?.totals?.lines;

    const tsTotal = requireNumber(tsLines?.total, 'ts total lines');
    const tsCovered = requireNumber(tsLines?.covered, 'ts covered lines');
    const rustTotal = requireNumber(rustLines?.count, 'rust total lines');
    const rustCovered = requireNumber(rustLines?.covered, 'rust covered lines');
    const totalLines = tsTotal + rustTotal;

    if (totalLines <= 0) {
        throw new Error('Combined coverage has no measurable lines');
    }

    const percentage = ((tsCovered + rustCovered) / totalLines) * 100;
    const message = `${percentage.toFixed(1)}%`;

    return {
        schemaVersion: 1,
        label: 'coverage',
        message,
        color: colorForPercentage(percentage)
    };
}

function readArg(name) {
    const prefix = `--${name}=`;
    const inline = process.argv.find((arg) => arg.startsWith(prefix));
    if (inline) {
        return inline.slice(prefix.length);
    }

    const index = process.argv.indexOf(`--${name}`);
    if (index >= 0 && index + 1 < process.argv.length) {
        return process.argv[index + 1];
    }

    return '';
}

function readJson(path, label) {
    if (!path) {
        throw new Error(`Missing --${label} path`);
    }
    return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function main() {
    const tsSummary = readJson(readArg('ts'), 'ts');
    const rustSummary = readJson(readArg('rust'), 'rust');
    const outPath = readArg('out');

    if (!outPath) {
        throw new Error('Missing --out path');
    }

    const badge = createCombinedCoverageBadge(tsSummary, rustSummary);
    fs.writeFileSync(outPath, `${JSON.stringify(badge)}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main();
}
