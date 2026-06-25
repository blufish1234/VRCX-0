import { useMemo, useState } from 'react';

import {
    DEFAULT_SCREENSHOT_SEARCH_SORT,
    SCREENSHOT_METADATA_SEARCH_TYPES,
    sortScreenshotSearchRows
} from './screenshotMetadataValues';

export function useScreenshotMetadataSearch() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState(
        SCREENSHOT_METADATA_SEARCH_TYPES[0].value
    );
    const [searchRows, setSearchRows] = useState<any[]>([]);
    const [searchViewMode, setSearchViewMode] = useState('detail');
    const [searchSort, setSearchSort] = useState(
        DEFAULT_SCREENSHOT_SEARCH_SORT
    );
    const [selectedPath, setSelectedPath] = useState('');

    const currentSearchType =
        SCREENSHOT_METADATA_SEARCH_TYPES.find(
            (type: any) => type.value === searchType
        ) ?? SCREENSHOT_METADATA_SEARCH_TYPES[0];

    const sortedSearchRows = useMemo(
        () => sortScreenshotSearchRows(searchRows, searchSort),
        [searchRows, searchSort]
    );

    const searchNavigationPaths = useMemo(
        () => sortedSearchRows.map((row: any) => row.filePath),
        [sortedSearchRows]
    );
    const selectedPathIndex = searchNavigationPaths.indexOf(selectedPath);

    function resetSearchTable({ clearQuery = false }: any = {}) {
        setSearchRows([]);
        setSelectedPath('');
        if (clearQuery) {
            setSearchQuery('');
        }
        setSearchViewMode('detail');
    }

    function toggleSearchSort(key: any) {
        setSearchSort((current: any) => {
            if (current.key === key) {
                return {
                    ...current,
                    asc: !current.asc
                };
            }

            return {
                key,
                asc: key !== 'dateTime'
            };
        });
    }

    return {
        currentSearchType,
        resetSearchTable,
        searchNavigationPaths,
        searchQuery,
        searchRows,
        searchSort,
        searchType,
        searchViewMode,
        selectedPath,
        selectedPathIndex,
        setSearchQuery,
        setSearchRows,
        setSearchType,
        setSearchViewMode,
        setSelectedPath,
        sortedSearchRows,
        toggleSearchSort
    };
}
