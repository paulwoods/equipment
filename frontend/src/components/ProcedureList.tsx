import React, {useMemo, useState} from 'react';
import type {Procedure} from '../types/procedure';
import {Link} from 'react-router-dom';
import {SortIndicator} from './SortIndicator';
import {SearchInput} from './SearchInput';
import {Button} from './ui/button';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from './ui/table';
import {TableSkeleton} from './TableSkeleton';

interface ProcedureListProps {
  equipmentId: string;
  procedures: Procedure[];
  onDelete: (id: string) => void;
  loading?: boolean;
}

type SortField = 'name' | 'description' | 'intervalDays';
type SortOrder = 'asc' | 'desc';

export const ProcedureList = ({equipmentId, procedures, onDelete, loading = false}: ProcedureListProps): React.JSX.Element => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const filteredAndSortedProcedures = useMemo(() => {
    let result = [...procedures];
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(proc =>
        proc.name.toLowerCase().includes(lowerSearch) ||
        (proc.description && proc.description.toLowerCase().includes(lowerSearch))
      );
    }
    result.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      if (sortField === 'name' || sortField === 'description') {
        aValue = (a[sortField] ?? '').toLowerCase();
        bValue = (b[sortField] ?? '').toLowerCase();
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [procedures, searchTerm, sortField, sortOrder]);

  const handleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-4">
        <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search procedures..."
        />

      {loading ? (
        <TableSkeleton rows={4} columns={4} />
      ) : (
        <>
          <div className="hidden md:block rounded-md border overflow-hidden" style={{borderColor: 'var(--border)'}}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                    Name <SortIndicator field="name" sortField={sortField} sortOrder={sortOrder}/>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('description')}>
                    Description <SortIndicator field="description" sortField={sortField} sortOrder={sortOrder}/>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('intervalDays')}>
                    Interval <SortIndicator field="intervalDays" sortField={sortField} sortOrder={sortOrder}/>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedProcedures.map((proc) => (
                  <TableRow key={proc.id}>
                    <TableCell className="font-medium">
                      <Link to={`/equipment/${equipmentId}/procedures/${proc.id}`}
                            className="text-primary hover:underline">
                        {proc.name}
                      </Link>
                    </TableCell>
                    <TableCell>{proc.description}</TableCell>
                    <TableCell>{proc.intervalDays}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild className="mr-1">
                        <Link to={`/equipment/${equipmentId}/procedures/${proc.id}/perform`}>Perform</Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild className="mr-1">
                        <Link to={`/equipment/${equipmentId}/procedures/${proc.id}/history`}>History</Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild className="mr-1">
                        <Link to={`/equipment/${equipmentId}/procedures/${proc.id}/edit`}>Edit</Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(proc.id)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden divide-y" style={{borderColor: 'var(--border)'}}>
            {filteredAndSortedProcedures.map((proc) => (
              <div key={proc.id} className="py-4 space-y-3">
                <div>
                  <Link to={`/equipment/${equipmentId}/procedures/${proc.id}`} className="text-primary hover:underline">
                    <h3 className="text-sm font-bold">{proc.name}</h3>
                  </Link>
                  {proc.description && <p className="text-sm text-muted-foreground line-clamp-2">{proc.description}</p>}
                </div>
                <div className="text-xs text-muted-foreground">Interval: {proc.intervalDays} days</div>
                <div className="flex flex-wrap justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/equipment/${equipmentId}/procedures/${proc.id}/perform`}>Perform</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/equipment/${equipmentId}/procedures/${proc.id}/history`}>History</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/equipment/${equipmentId}/procedures/${proc.id}/edit`}>Edit</Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(proc.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredAndSortedProcedures.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">
              {searchTerm ? 'No procedures match your search.' : 'No procedures found for this equipment.'}
            </div>
          )}
        </>
      )}
    </div>
  );
};
