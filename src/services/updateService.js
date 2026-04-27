import { backend } from '@/platform/index.js';
import { webRepository } from '@/repositories/index.js';
import { branches } from '@/shared/constants/settings.js';
import {
    compareReleaseVersions,
    formatReleaseDisplayVersion,
    parseReleaseVersion
} from '@/shared/utils/releaseVersion.js';

const UPDATE_PROGRESS_COMPLETE = 101;
const UPDATE_PROGRESS_ERROR = -1;
const INSTALLABLE_PLATFORMS = new Set(['windows', 'linux']);
let updateDownloadInFlight = null;

function channelIdForBranch(branch) {
    return String(sanitizeBranch(branch)).toLowerCase();
}

function platformIdForHost(hostPlatform) {
    return hostPlatform === 'linux'
        ? 'linux-x86_64'
        : hostPlatform === 'windows'
          ? 'windows-x86_64'
          : '';
}

function getUpdaterTarget(hostPlatform, branch) {
    const platformId = platformIdForHost(hostPlatform);
    return platformId ? `${platformId}-${channelIdForBranch(branch)}` : '';
}

function getUpdaterManifestAssetName(hostPlatform, branch) {
    const target = getUpdaterTarget(hostPlatform, branch);
    return target ? `vrcx-0-updater-${target}.json` : '';
}

function canInstallUpdatesOnPlatform(hostPlatform) {
    return INSTALLABLE_PLATFORMS.has(hostPlatform);
}

function getTauriManifestAssetOfInterest(assets = [], hostPlatform, branch) {
    const manifestName = getUpdaterManifestAssetName(hostPlatform, branch);
    if (!manifestName) {
        return null;
    }

    const asset = assets.find(
        (item) => item?.state === 'uploaded' && item.name === manifestName
    );
    if (!asset?.browser_download_url) {
        return null;
    }

    return {
        manifestUrl: asset.browser_download_url,
        target: getUpdaterTarget(hostPlatform, branch),
        updaterType: 'tauri'
    };
}

function normalizeGitHubRelease(
    release,
    { branch, hostPlatform = 'unknown', requireInstallerAsset = true } = {}
) {
    const parsedVersion = parseReleaseVersion(release?.tag_name);
    if (!parsedVersion) {
        return null;
    }

    const tauriAsset = getTauriManifestAssetOfInterest(
        release.assets,
        hostPlatform,
        branch || parsedVersion.channel
    );
    const asset = tauriAsset;
    if (requireInstallerAsset && !asset) {
        return null;
    }

    return {
        ...(asset || {}),
        canonicalVersion: parsedVersion.canonicalVersion,
        channel: parsedVersion.channel,
        displayVersion: parsedVersion.displayVersion,
        htmlUrl: release.html_url || '',
        tagName: release.tag_name,
        displayName: release.name || `VRCX-0 ${parsedVersion.displayVersion}`,
        prerelease: Boolean(release.prerelease),
        publishedAt: release.published_at || '',
        body: release.body || '',
        updaterType: asset?.updaterType || 'manual'
    };
}

function normalizeReleaseList(branch, releases, options = {}) {
    const normalizedBranch = sanitizeBranch(branch);
    const shouldKeepPrerelease = normalizedBranch !== 'Stable';
    return (Array.isArray(releases) ? releases : [releases])
        .map((release) =>
            normalizeGitHubRelease(release, {
                ...options,
                branch: normalizedBranch
            })
        )
        .filter(
            (release) =>
                release &&
                release.channel === normalizedBranch &&
                release.prerelease === shouldKeepPrerelease
        )
        .sort((left, right) =>
            compareReleaseVersions(
                right.canonicalVersion,
                left.canonicalVersion
            )
        );
}

function sanitizeBranch(branch) {
    if (branch === 'Alpha') {
        return 'Alpha';
    }
    return branch === 'Beta' ? 'Beta' : 'Stable';
}

function defaultBranchForVersion(version = VERSION || '') {
    return parseReleaseVersion(version)?.channel || 'Stable';
}

function hasUpdateForBranch(branch, currentVersion, latestReleaseVersion) {
    const currentParsed = parseReleaseVersion(currentVersion);
    const latestParsed = parseReleaseVersion(latestReleaseVersion);

    if (!currentParsed || !latestParsed) {
        return false;
    }

    const normalizedBranch = sanitizeBranch(branch);
    if (latestParsed.channel !== normalizedBranch) {
        return false;
    }

    if (normalizedBranch !== 'Stable') {
        const versionDelta =
            latestParsed.year - currentParsed.year ||
            latestParsed.month - currentParsed.month ||
            latestParsed.patchNumber - currentParsed.patchNumber;
        if (versionDelta !== 0) {
            return versionDelta > 0;
        }

        if (
            currentParsed.channel === 'Stable' &&
            latestParsed.channel === normalizedBranch
        ) {
            return true;
        }
    }

    return (
        compareReleaseVersions(latestParsed.canonicalVersion, currentParsed) > 0
    );
}

async function fetchBranchReleases(branch, options = {}) {
    const normalizedBranch = sanitizeBranch(branch);
    const response = await webRepository.execute({
        url: branches[normalizedBranch].urlReleases,
        method: 'GET',
        headers: {
            Accept: 'application/vnd.github+json'
        }
    });
    if (response.status && response.status !== 200) {
        throw new Error(`GitHub release request failed (${response.status}).`);
    }

    const data =
        typeof response.data === 'string'
            ? JSON.parse(response.data)
            : response.data;
    if (data?.message) {
        throw new Error(data.message);
    }

    return normalizeReleaseList(normalizedBranch, data, options);
}

async function fetchLatestBranchRelease(branch, options = {}) {
    const releases = await fetchBranchReleases(branch, options);
    return releases[0] || null;
}

async function waitForUpdateDownload({
    onProgress,
    isCancelled,
    isReady,
    pollMs = 150,
    timeoutMs = 30 * 60 * 1000
} = {}) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
        if (isCancelled?.()) {
            await backend.app.CancelUpdate().catch(() => {});
            throw new Error('Update download cancelled.');
        }

        const progress =
            Number(await backend.app.CheckUpdateProgress().catch(() => 0)) || 0;
        if (progress === UPDATE_PROGRESS_ERROR) {
            throw new Error('Update download failed.');
        }

        onProgress?.(Math.max(0, Math.min(100, progress)));
        if (progress >= UPDATE_PROGRESS_COMPLETE) {
            const ready = isReady
                ? await isReady()
                : await checkPendingInstallUpdate();
            if (ready) {
                onProgress?.(100);
                return true;
            }
        }

        await new Promise((resolve) => window.setTimeout(resolve, pollMs));
    }

    throw new Error('Update download timed out.');
}

async function checkPendingInstallUpdate(hostPlatform = 'unknown') {
    if (canInstallUpdatesOnPlatform(hostPlatform)) {
        const hasTauriUpdate = await backend.app
            .CheckForTauriUpdate()
            .catch(() => false);
        if (hasTauriUpdate) {
            return 'tauri';
        }
    }

    return '';
}

async function downloadUpdateAndWait(release, options = {}) {
    if (updateDownloadInFlight) {
        throw new Error('An update download is already in progress.');
    }
    if (!release?.manifestUrl || !release?.target) {
        throw new Error('Selected release has no Tauri updater manifest.');
    }

    updateDownloadInFlight = (async () => {
        await backend.app.DownloadTauriUpdate(
            release.manifestUrl,
            release.target
        );
        await waitForUpdateDownload({
            ...options,
            isReady:
                options.isReady ||
                (() => backend.app.CheckForTauriUpdate().catch(() => false))
        });
        return release;
    })();

    try {
        return await updateDownloadInFlight;
    } finally {
        updateDownloadInFlight = null;
    }
}

function isUpdateDownloadInFlight() {
    return Boolean(updateDownloadInFlight);
}

export {
    UPDATE_PROGRESS_COMPLETE,
    UPDATE_PROGRESS_ERROR,
    canInstallUpdatesOnPlatform,
    checkPendingInstallUpdate,
    defaultBranchForVersion,
    downloadUpdateAndWait,
    fetchBranchReleases,
    fetchLatestBranchRelease,
    formatReleaseDisplayVersion,
    getUpdaterManifestAssetName,
    getUpdaterTarget,
    hasUpdateForBranch,
    isUpdateDownloadInFlight,
    normalizeGitHubRelease,
    normalizeReleaseList,
    sanitizeBranch,
    waitForUpdateDownload
};
