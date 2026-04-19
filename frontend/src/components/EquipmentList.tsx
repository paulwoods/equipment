import type {Equipment, EquipmentStatus} from "../types/equipment";
import {Link} from "react-router-dom";
import {useMemo, useState} from "react";
import {ChevronDown, ChevronUp, Search, X} from "lucide-react";

interface EquipmentListProps {
    items: Equipment[];
    onDelete: (id: string) => void;
}

type SortField = 'manufacturer' | 'modelNumber' | 'location' | 'status';
type SortOrder = 'asc' | 'desc';

export default function EquipmentList({items, onDelete}: EquipmentListProps) {
    const [searchTerm, setSearchTerm] = useState("");
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
            const aValue: string = a[sortField]?.toLowerCase() || "";
            const bValue: string = b[sortField]?.toLowerCase() || "";

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [items, searchTerm, sortField, sortOrder]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    return (
        <div className="space-y-4">
            <div className="px-4 md:px-6 pt-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400"/>
                        </div>
                        <input
                            type="text"
                            placeholder="Search equipment..."
                            className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                                onClick={() => setSearchTerm("")}
                            >
                                <X className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"/>
                            </button>
                        )}
                    </div>
                    <Link
                        to="/equipment/import"
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center justify-center whitespace-nowrap"
                    >
                        Import
                    </Link>
                    <Link
                        to="/equipment/new"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center justify-center whitespace-nowrap"
                    >
                        Add Equipment
                    </Link>
                </div>
            </div>

            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                            onClick={() => handleSort('modelNumber')}
                        >
                            Model Number <SortIndicator field="modelNumber" sortField={sortField}
                                                        sortOrder={sortOrder}/>
                        </th>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                            onClick={() => handleSort('manufacturer')}
                        >
                            Manufacturer <SortIndicator field="manufacturer" sortField={sortField}
                                                        sortOrder={sortOrder}/>
                        </th>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                            onClick={() => handleSort('location')}
                        >
                            Location <SortIndicator field="location" sortField={sortField} sortOrder={sortOrder}/>
                        </th>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                            onClick={() => handleSort('status')}
                        >
                            Status <SortIndicator field="status" sortField={sortField} sortOrder={sortOrder}/>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Procedures</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {filteredAndSortedItems.map((item) => (
                        <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <Link to={`/equipment/${item.id}`}
                                      className="text-blue-600 dark:text-blue-400 hover:underline transition-colors">
                                    {item.modelNumber}
                                </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.manufacturer}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.location || "-"}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                <StatusBadge status={item.status}/>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                <ProcedureBadge item={item}/>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Link
                                    to={`/equipment/${item.id}/edit`}
                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                                >
                                    Edit
                                </Link>
                                <button
                                    onClick={() => onDelete(item.id)}
                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-800">
                {filteredAndSortedItems.map((item) => (
                    <div key={item.id} className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <Link to={`/equipment/${item.id}`}
                                      className="hover:underline text-blue-600 dark:text-blue-400">
                                    <h3 className="text-sm font-bold">{item.modelNumber}</h3>
                                </Link>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{item.manufacturer}</p>
                                {item.location &&
                                  <p className="text-xs text-gray-500 dark:text-gray-500">{item.location}</p>}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <ProcedureBadge item={item}/>
                                <StatusBadge status={item.status}/>
                            </div>
                        </div>
                        {item.description && (
                            <p className="text-sm text-gray-700 dark:text-gray-300">{item.description}</p>
                        )}
                        <div className="flex justify-end gap-4 pt-2">
                            <Link
                                to={`/equipment/${item.id}/edit`}
                                className="text-sm text-blue-600 dark:text-blue-400 font-medium"
                            >
                                Edit
                            </Link>
                            <button
                                onClick={() => onDelete(item.id)}
                                className="text-sm text-red-600 dark:text-red-400 font-medium cursor-pointer"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredAndSortedItems.length === 0 && (
                <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    {searchTerm ? "No equipment matches your search." : "No equipment found. Add some to get started!"}
                </div>
            )}
        </div>
    );
}

function SortIndicator({field, sortField, sortOrder}: {
    field: SortField;
    sortField: SortField;
    sortOrder: SortOrder;
}) {
    if (sortField !== field) return <div className="w-4 h-4 ml-1 inline-block"/>;
    return sortOrder === 'asc'
        ? <ChevronUp className="w-4 h-4 ml-1 inline-block"/>
        : <ChevronDown className="w-4 h-4 ml-1 inline-block"/>;
}

function StatusBadge({status}: { status: EquipmentStatus }) {
    const colors = {
        'Active': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        'In Use': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        'Under Repair': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        'Decommissioned': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        'In Storage': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.Active}`}>
      {status}
    </span>
    );
}

function ProcedureBadge({item}: { item: Equipment }) {
    return (
        <Link
            to={`/equipment/${item.id}/procedures`}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
        >
            View
        </Link>
    );
}
