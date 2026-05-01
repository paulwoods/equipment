import {useCallback, useState} from "react";

export type SortOrder = "asc" | "desc";

interface UseSortReturn<K extends string> {
    sortField: K;
    sortOrder: SortOrder;
    handleSort: (field: K) => void;
}

export const useSort = <K extends string>(
    defaultField: K,
    defaultOrder: SortOrder = "asc",
): UseSortReturn<K> => {
    const [sortField, setSortField] = useState<K>(defaultField);
    const [sortOrder, setSortOrder] = useState<SortOrder>(defaultOrder);

    const handleSort = useCallback(
        (field: K) => {
            if (sortField === field) {
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
            } else {
                setSortField(field);
                setSortOrder("asc");
            }
        },
        [sortField],
    );

    return {sortField, sortOrder, handleSort};
};
