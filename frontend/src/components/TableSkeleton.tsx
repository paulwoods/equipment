import React from 'react';
import {Skeleton} from './ui/skeleton';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton = ({rows = 5, columns = 4}: TableSkeletonProps): React.JSX.Element => {
  return (
    <div className="space-y-2 p-4">
      {Array.from({length: rows}).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({length: columns}).map((_, j) => (
            <Skeleton key={j} className="h-8 flex-1 rounded-md" />
          ))}
        </div>
      ))}
    </div>
  );
};
