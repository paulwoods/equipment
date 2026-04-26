import React, {useMemo, useState} from 'react';
import type {Equipment, EquipmentStatus} from '../types/equipment';
import {Link} from 'react-router-dom';
import {ChevronDown, ChevronUp, Search, X} from 'lucide-react';
import {Badge} from './ui/badge';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from './ui/table';
import {TableSkeleton} from './TableSkeleton';

interface EquipmentListProps {
  items: Equipment[];
  onDelete: (id: string) => void;
  loading?: boolean;
}

type SortField = 'manufacturer' | 'modelNumber' | 'location' | 'status';
type SortOrder = 'asc' | 'desc';

const statusVariant: Record<EquipmentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  'Active': 'default',
  'In Use': 'secondary',
  'Under Repair': 'outline',
  'Decommissioned': 'destructive',
  'In Storage': 'secondary',
};

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

export const EquipmentList = ({items, onDelete, loading = false}: EquipmentListProps): React.JSX.Element => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('manufacturer');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(item =>
        item.manufacturer.toLowerCase().includes(lowerSearch) ||
        item.modelNumber.toLowerCase().includes(lowerSearch) ||
        (item.location && item.location.toLowerCase().includes(lowerSearch)) ||
        (item.status && item.status.toLowerCase().includes(lowerSearch)) ||
        (item.description && item.description.toLowerCase().includes(lowerSearch))
      );
    }
    result.sort((a, b) => {
      const aValue: string = a[sortField]?.toLowerCase() ?? '';
      const bValue: string = b[sortField]?.toLowerCase() ?? '';
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [items, searchTerm, sortField, sortOrder]);

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
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]"/>
          <Input
            type="text"
            placeholder="Search equipment..."
            className="pl-10 pr-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => setSearchTerm('')}>
              <X className="h-4 w-4 text-[var(--muted-foreground)]"/>
            </button>
          )}
        </div>
        <Button variant="secondary" asChild>
          <Link to="/equipment/import">Import</Link>
        </Button>
        <Button asChild>
          <Link to="/equipment/new">Add Equipment</Link>
        </Button>
      </div>

      {loading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-[var(--muted)]">
                <TableRow>
                  <TableHead
                      className="px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)]"
                      onClick={() => handleSort('modelNumber')}>
                    Model Number <SortIndicator field="modelNumber" sortField={sortField} sortOrder={sortOrder}/>
                  </TableHead>
                  <TableHead
                      className="px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)]"
                      onClick={() => handleSort('manufacturer')}>
                    Manufacturer <SortIndicator field="manufacturer" sortField={sortField} sortOrder={sortOrder}/>
                  </TableHead>
                  <TableHead
                      className="px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)]"
                      onClick={() => handleSort('location')}>
                    Location <SortIndicator field="location" sortField={sortField} sortOrder={sortOrder}/>
                  </TableHead>
                  <TableHead
                      className="px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)]"
                      onClick={() => handleSort('status')}>
                    Status <SortIndicator field="status" sortField={sortField} sortOrder={sortOrder}/>
                  </TableHead>
                  <TableHead
                      className="px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Procedures</TableHead>
                  <TableHead
                      className="px-6 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-[var(--card)] divide-y divide-[var(--border)]">
                {filteredAndSortedItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--foreground)]">
                      <Link to={`/equipment/${item.id}`} className="text-[var(--primary)] hover:underline">
                        {item.modelNumber}
                      </Link>
                    </TableCell>
                    <TableCell
                        className="px-6 py-4 whitespace-nowrap text-sm text-[var(--foreground)]">{item.manufacturer}</TableCell>
                    <TableCell
                        className="px-6 py-4 whitespace-nowrap text-sm text-[var(--foreground)]">{item.location ?? '-'}</TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-[var(--foreground)]">
                      <Badge variant={statusVariant[item.status] ?? 'default'}>{item.status}</Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-[var(--foreground)]">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/equipment/${item.id}/procedures`}>View</Link>
                      </Button>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-3 justify-end">
                        <Link to={`/equipment/${item.id}/edit`}
                              className="text-[var(--primary)] hover:underline text-sm font-medium">
                          Edit
                        </Link>
                        <button
                            className="text-[var(--destructive)] hover:opacity-80 text-sm font-medium cursor-pointer"
                            onClick={() => onDelete(item.id)}>
                          Delete
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden divide-y" style={{borderColor: 'var(--border)'}}>
            {filteredAndSortedItems.map((item) => (
              <div key={item.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <Link to={`/equipment/${item.id}`} className="text-[var(--primary)] hover:underline">
                      <h3 className="text-sm font-bold">{item.modelNumber}</h3>
                    </Link>
                    <p className="text-sm text-[var(--muted-foreground)]">{item.manufacturer}</p>
                    {item.location && <p className="text-xs text-[var(--muted-foreground)]">{item.location}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/equipment/${item.id}/procedures`}>View</Link>
                    </Button>
                    <Badge variant={statusVariant[item.status] ?? 'default'}>{item.status}</Badge>
                  </div>
                </div>
                {item.description && <p className="text-sm text-[var(--muted-foreground)]">{item.description}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/equipment/${item.id}/edit`}>Edit</Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="text-[var(--destructive)]" onClick={() => onDelete(item.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredAndSortedItems.length === 0 && (
            <div className="py-10 text-center text-sm text-[var(--muted-foreground)]">
              {searchTerm ? 'No equipment matches your search.' : 'No equipment found. Add some to get started!'}
            </div>
          )}
        </>
      )}
    </div>
  );
};
