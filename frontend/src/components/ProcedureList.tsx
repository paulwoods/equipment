import type {Procedure} from "../types/procedure";
import {calculateDueDetails} from "../lib/procedureUtils";
import {Link} from "react-router-dom";
import {useMemo, useState} from "react";
import {ChevronDown, ChevronUp, Search, X} from "lucide-react";

interface ProcedureListProps {
    equipmentId: string;
    procedures: Procedure[];
    onDelete: (id: string) => void;
}

type SortField = 'name' | 'description' | 'intervalDays' | 'daysTillDue';
type SortOrder = 'asc' | 'desc';

function SortIndicator({field, sortField, sortOrder}: {
    field: SortField;
    sortField: SortField;
    sortOrder: SortOrder
}) {
    if (sortField !== field) return <div className="w-4 h-4 ml-1 inline-block"/>;
    return sortOrder === 'asc' ?
        <ChevronUp className="w-4 h-4 ml-1 inline-block"/> :
        <ChevronDown className="w-4 h-4 ml-1 inline-block"/>;
}

export default function ProcedureList({equipmentId, procedures, onDelete}: ProcedureListProps) {
    const [searchTerm, setSearchTerm] = useState("");
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
            const aDue = calculateDueDetails(a);
            const bDue = calculateDueDetails(b);

            if (aDue === null && bDue !== null) return -1;
            if (aDue !== null && bDue === null) return 1;

            let aValue: string | number;
            let bValue: string | number;

            if (sortField === 'daysTillDue') {
                aValue = aDue?.daysTillDue ?? 0;
                bValue = bDue?.daysTillDue ?? 0;
            } else if (sortField === 'name' || sortField === 'description') {
                aValue = (a[sortField] || "").toLowerCase();
                bValue = (b[sortField] || "").toLowerCase();
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
            <div className="pt-2">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400"/>
                    </div>
                    <input
                        type="text"
                        placeholder="Search procedures..."
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
            </div>

            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                            onClick={() => handleSort('name')}
                        >
                            Name <SortIndicator field="name" sortField={sortField} sortOrder={sortOrder}/>
                        </th>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                            onClick={() => handleSort('description')}
                        >
                            Description <SortIndicator field="description" sortField={sortField} sortOrder={sortOrder}/>
                        </th>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                            onClick={() => handleSort('intervalDays')}
                        >
                            Interval <SortIndicator field="intervalDays" sortField={sortField} sortOrder={sortOrder}/>
                        </th>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                            onClick={() => handleSort('daysTillDue')}
                        >
                            Days Till Due <SortIndicator field="daysTillDue" sortField={sortField}
                                                         sortOrder={sortOrder}/>
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {filteredAndSortedProcedures.map((proc) => {
                        const dueDetails = calculateDueDetails(proc);

                        return (
                            <tr key={proc.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium">
                                    <Link to={`/equipment/${equipmentId}/procedures/${proc.id}`}
                                          className="text-blue-600 dark:text-blue-400 hover:underline">
                                        {proc.name}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{proc.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{proc.intervalDays}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                    <DueStatus details={dueDetails}/>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <ActionLinks equipmentId={equipmentId} proc={proc} onDelete={onDelete}/>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-800">
                {filteredAndSortedProcedures.map((proc) => {
                    const dueDetails = calculateDueDetails(proc);
                    return (
                        <div key={proc.id} className="py-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Link to={`/equipment/${equipmentId}/procedures/${proc.id}`}
                                          className="hover:underline text-blue-600 dark:text-blue-400">
                                        <h3 className="text-sm font-bold">{proc.name}</h3>
                                    </Link>
                                    {proc.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{proc.description}</p>
                                    )}
                                </div>
                                <DueStatus details={dueDetails}/>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                Interval: {proc.intervalDays} days
                            </div>
                            <div className="flex flex-wrap justify-end gap-3 pt-2">
                                <ActionLinks equipmentId={equipmentId} proc={proc} onDelete={onDelete}/>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredAndSortedProcedures.length === 0 && (
                <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    {searchTerm ? "No procedures match your search." : "No procedures found for this equipment."}
                </div>
            )}
        </div>
    );
}


function DueStatus({details}: { details: ReturnType<typeof calculateDueDetails> }) {
    if (!details) return <span className="text-gray-400 italic text-sm">N/A</span>;

    return (
        <div
            className={details.daysTillDue <= 0 ? "text-red-600 dark:text-red-400 font-bold" : "text-gray-900 dark:text-gray-100"}>
            <div className="text-sm">
                {details.daysTillDue} days
            </div>
            <div className="text-xs opacity-75">
                ({details.dueDate.toLocaleDateString()})
            </div>
        </div>
    );
}

function ActionLinks({equipmentId, proc, onDelete}: {
    equipmentId: string;
    proc: Procedure;
    onDelete: (id: string) => void
}) {
    return (
        <>
            <Link
                to={`/equipment/${equipmentId}/procedures/${proc.id}/perform`}
                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium mr-4 md:mr-4 last:mr-0"
            >
                Perform
            </Link>
            <Link
                to={`/equipment/${equipmentId}/procedures/${proc.id}/history`}
                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium mr-4 md:mr-4 last:mr-0"
            >
                History
            </Link>
            <Link
                to={`/equipment/${equipmentId}/procedures/${proc.id}/edit`}
                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium mr-4 md:mr-4 last:mr-0"
            >
                Edit
            </Link>
            <button
                onClick={() => onDelete(proc.id)}
                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium cursor-pointer"
            >
                Delete
            </button>
        </>
    );
}
