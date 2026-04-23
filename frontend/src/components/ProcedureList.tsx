import React, {useMemo, useState} from 'react';
import type {Procedure} from '../types/procedure';
import {Link} from 'react-router-dom';
import {ChevronDown, ChevronUp, Search, X} from 'lucide-react';
import {Button} from './ui/button';
import {Input} from './ui/input';
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

const SortIndicator = ({field, sortField, sortOrder}: {
  field: SortField;
  sortField: SortField;
  sortOrder: SortOrder;
}): React.JSX.Element => {
  if (sortField !== field) return <div className="w-4 h-4 ml-1 inline-block"/>;
  return sortOrder === 'asc'
    ? <ChevronUp className="w-4 h-4 ml-1 inline-block"/>
    : <ChevronDown className="w-4 h-4 ml-1 inline-block"/>;
};

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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]"/>
        <Input
          type="text"
          placeholder="Search procedures..."
          className="pl-10 pr-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => setSearchTerm('')}>
            <X className="h-4 w-4 text-[var(--muted-foreground)]"/>
          </button>
        )}
      </div>

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
                      <Link to={`/equipment/${equipmentId}/procedures/${proc.id}`} className="text-[var(--primary)] hover:underline">
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
                      <Button variant="ghost" size="sm" className="text-[var(--destructive)]" onClick={() => onDelete(proc.id)}>
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
                  <Link to={`/equipment/${equipmentId}/procedures/${proc.id}`} className="text-[var(--primary)] hover:underline">
                    <h3 className="text-sm font-bold">{proc.name}</h3>
                  </Link>
                  {proc.description && <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">{proc.description}</p>}
                </div>
                <div className="text-xs text-[var(--muted-foreground)]">Interval: {proc.intervalDays} days</div>
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
                  <Button variant="ghost" size="sm" className="text-[var(--destructive)]" onClick={() => onDelete(proc.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredAndSortedProcedures.length === 0 && (
            <div className="py-10 text-center text-sm text-[var(--muted-foreground)]">
              {searchTerm ? 'No procedures match your search.' : 'No procedures found for this equipment.'}
            </div>
          )}
        </>
      )}
    </div>
  );
};
