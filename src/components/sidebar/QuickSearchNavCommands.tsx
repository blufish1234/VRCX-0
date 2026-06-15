import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getNavIconComponent } from '@/components/layout/navIconRegistry';
import { getPathForNavEntry } from '@/components/layout/navMenuModel';
import { navDefinitions } from '@/shared/constants/ui';
import { CommandGroup, CommandItem } from '@/ui/shadcn/command';

const NAV_RESULT_LIMIT = 6;

export function useNavCommands(normalizedQuery: any) {
    const { t } = useTranslation();

    const allCommands = useMemo(
        () =>
            navDefinitions
                .map((definition: any) => {
                    const path = getPathForNavEntry(definition);
                    if (!path) {
                        return null;
                    }
                    const label = t(definition.labelKey);
                    // Match on the stable key + path too, so navigation is
                    // findable regardless of the active UI language.
                    const keywords =
                        `${label} ${definition.key} ${path}`.toLowerCase();
                    return {
                        key: definition.key,
                        path,
                        label,
                        icon: definition.icon,
                        keywords
                    };
                })
                .filter(Boolean),
        [t]
    );

    return useMemo(() => {
        if (!normalizedQuery) {
            return [];
        }
        return allCommands
            .filter((command: any) =>
                command.keywords.includes(normalizedQuery)
            )
            .slice(0, NAV_RESULT_LIMIT);
    }, [allCommands, normalizedQuery]);
}

export function NavResultGroup({ title, items, onSelect }: any) {
    if (!items.length) {
        return null;
    }
    return (
        <CommandGroup heading={title}>
            {items.map((item: any) => {
                const Icon = getNavIconComponent(item.icon);
                return (
                    <CommandItem
                        key={`nav:${item.key}`}
                        value={item.keywords}
                        className="gap-3"
                        onSelect={() => onSelect(item)}
                    >
                        <Icon className="size-4 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">
                            {item.label}
                        </span>
                    </CommandItem>
                );
            })}
        </CommandGroup>
    );
}
