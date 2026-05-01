import React from 'react';
import {ChevronDown, ChevronUp} from 'lucide-react';

interface SortIndicatorProps {
    field: string;
    sortField: string;
    sortOrder: 'asc' | 'desc';
}

export const SortIndicator = ({field, sortField, sortOrder}: SortIndicatorProps): React.JSX.Element => {
    if (sortField !== field) return <div className="w-4 h-4 ml-1 inline-block"/>;
    return sortOrder === 'asc'
        ? <ChevronUp className="w-4 h-4 ml-1 inline-block"/>
        : <ChevronDown className="w-4 h-4 ml-1 inline-block"/>;
};
