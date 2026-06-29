import type { RowData } from '@tanstack/react-table';

declare module '@tanstack/react-table' {
    interface ColumnMeta<TData extends RowData, TValue> {
        label?: string | (() => string);
        tableHeadClassName?: string;
        tableCellClassName?: string;
        disableReorder?: boolean;
        disableVisibilityToggle?: boolean;
        spacer?: boolean;
        isSpacer?: boolean;
    }

    interface TableMeta<TData extends RowData> {
        columnOrderLocked?: boolean | { value?: boolean };
        setColumnOrderLocked?: (locked: boolean) => void;
        onColumnOrderLockedChange?: (locked: boolean) => void;
    }
}
