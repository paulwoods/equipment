"use client";

import {useEffect, useMemo, useState} from "react";
import Link from "next/link";
import {Equipment} from "@/types/equipment";
import {Procedure} from "@/types/procedure";
import {calculateDueDetails} from "@/lib/procedureUtils";
import {deleteProcedureAction, fetchEquipment} from "../actions";
import {Calendar as CalendarIcon, ChevronDown, ChevronUp, List, Search, X} from "lucide-react";
import CalendarView from "@/components/CalendarView";

interface FlattenedProcedure extends Procedure {
    equipmentId: string;
    equipmentName: string;
}

type SortField = 'equipmentName' | 'name' | 'intervalDays' | 'daysTillDue';
type SortOrder = 'asc' | 'desc';

export default function Dashboard() {
    const [procedures, setProcedures] = useState<FlattenedProcedure[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState<SortField>('daysTillDue');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list');

    const loadData = async () => {
        setLoading(true);
        const allEquipment = await fetchEquipment();
        const flattened: FlattenedProcedure[] = [];

        allEquipment.forEach((eq: Equipment) => {
            if (eq.procedures) {
                eq.procedures.forEach((proc: Procedure) => {
                    flattened.push({
                        ...proc,
                        equipmentId: eq.id,
                        equipmentName: `${eq.manufacturer} ${eq.modelNumber}`
                    });
                });
            }
        });

        setProcedures(flattened);
        setLoading(false);
    };

    const calendarEvents = useMemo(() => {
        return procedures.map(proc => {
            const due = calculateDueDetails(proc);
            return {
                date: due?.dueDate || new Date(),
                equipmentId: proc.equipmentId,
                equipmentName: proc.equipmentName,
                procedureId: proc.id,
                procedureName: proc.name,
                isOverdue: (due?.daysTillDue || 0) <= 0 && due !== null
            };
        }).filter(event => event !== null);
    }, [procedures]);

    const filteredAndSortedProcedures = useMemo(() => {
        let result = [...procedures];

        // Filtering
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(proc =>
                proc.equipmentName.toLowerCase().includes(lowerSearch) ||
                proc.name.toLowerCase().includes(lowerSearch) ||
                (proc.description && proc.description.toLowerCase().includes(lowerSearch))
            );
        }

        // Sorting
        result.sort((a, b) => {
            // Always place procedures with null due details at the top
            const aDue = calculateDueDetails(a);
            const bDue = calculateDueDetails(b);

            if (aDue === null && bDue !== null) return -1;
            if (aDue !== null && bDue === null) return 1;

            let aValue: any;
            let bValue: any;

            if (sortField === 'daysTillDue') {
                aValue = aDue?.daysTillDue ?? 0;
                bValue = bDue?.daysTillDue ?? 0;
            } else if (sortField === 'equipmentName' || sortField === 'name') {
                aValue = a[sortField].toLowerCase();
                bValue = b[sortField].toLowerCase();
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

    useEffect(() => {
        loadData();
    }, []);

    const handleDelete = async (equipmentId: string, procedureId: string) => {
        if (confirm("Are you sure you want to delete this procedure?")) {
            await deleteProcedureAction(equipmentId, procedureId);
            await loadData();
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
                    <Link
                        href="/equipment"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition w-fit"
                    >
                        Equipment
                    </Link>
                </div>

                <div className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading...</div>
                    ) : (
                        <div className="space-y-4">
                            {/* Tab Bar */}
                            <div className="flex border-b border-gray-200 dark:border-gray-800">
                                <button
                                    onClick={() => setActiveTab('list')}
                                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                                        activeTab === 'list'
                                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                    }`}
                                >
                                    <List className="w-4 h-4"/>
                                    List View
                                </button>
                                <button
                                    onClick={() => setActiveTab('calendar')}
                                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                                        activeTab === 'calendar'
                                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                    }`}
                                >
                                    <CalendarIcon className="w-4 h-4"/>
                                    Calendar View
                                </button>
                            </div>

                            {activeTab === 'list' ? (
                                <>
                                    {/* Search Bar */}
                                    <div className="px-4 md:px-6 pt-4">
                                        <div className="relative">
                                            <div
                                                className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                                    <DashboardList
                                        procedures={filteredAndSortedProcedures}
                                        onDelete={handleDelete}
                                        sortField={sortField}
                                        sortOrder={sortOrder}
                                        onSort={handleSort}
                                    />
                                </>
                            ) : (
                                <div className="p-4 md:p-6">
                                    <CalendarView events={calendarEvents}/>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
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

function DashboardList({procedures, onDelete, sortField, sortOrder, onSort}: {
    procedures: FlattenedProcedure[],
    onDelete: (eqId: string, procId: string) => void,
    sortField: SortField,
    sortOrder: SortOrder,
    onSort: (field: SortField) => void
}) {
    const SortIndicator = ({field}: { field: SortField }) => {
        if (sortField !== field) return <div className="w-4 h-4 ml-1 inline-block"/>;
        return sortOrder === 'asc' ?
            <ChevronUp className="w-4 h-4 ml-1 inline-block"/> :
            <ChevronDown className="w-4 h-4 ml-1 inline-block"/>;
    };

    return (
        <div>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                            onClick={() => onSort('equipmentName')}
                        >
                            Equipment <SortIndicator field="equipmentName"/>
                        </th>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                            onClick={() => onSort('name')}
                        >
                            Procedure <SortIndicator field="name"/>
                        </th>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                            onClick={() => onSort('intervalDays')}
                        >
                            Interval <SortIndicator field="intervalDays"/>
                        </th>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                            onClick={() => onSort('daysTillDue')}
                        >
                            Due In <SortIndicator field="daysTillDue"/>
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {procedures.map((proc) => {
                        const dueDetails = calculateDueDetails(proc);

                        return (
                            <tr key={`${proc.equipmentId}-${proc.id}`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                    <Link href={`/equipment/${proc.equipmentId}`}
                                          className="hover:underline text-blue-600 dark:text-blue-400">
                                        {proc.equipmentName}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                                    <Link href={`/equipment/${proc.equipmentId}/procedures/${proc.id}`}
                                          className="font-medium text-blue-600 dark:text-blue-400 hover:underline transition-colors">
                                        {proc.name}
                                    </Link>
                                    <div className="text-xs text-gray-500 line-clamp-1">{proc.description}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{proc.intervalDays} days</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                    <DueStatus details={dueDetails}/>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <ActionLinks equipmentId={proc.equipmentId} proc={proc} onDelete={onDelete}/>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-800">
                {procedures.map((proc) => {
                    const dueDetails = calculateDueDetails(proc);
                    return (
                        <div key={`${proc.equipmentId}-${proc.id}`} className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Link href={`/equipment/${proc.equipmentId}`}
                                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                                        {proc.equipmentName}
                                    </Link>
                                    <Link href={`/equipment/${proc.equipmentId}/procedures/${proc.id}`}
                                          className="hover:underline text-blue-600 dark:text-blue-400">
                                        <h3 className="text-sm font-bold">{proc.name}</h3>
                                    </Link>
                                </div>
                                <DueStatus details={dueDetails}/>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                Interval: {proc.intervalDays} days
                            </div>
                            <div className="flex flex-wrap justify-end gap-3 pt-2">
                                <ActionLinks equipmentId={proc.equipmentId} proc={proc} onDelete={onDelete}/>
                            </div>
                        </div>
                    );
                })}
            </div>

            {procedures.length === 0 && (
                <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No procedures found.
                </div>
            )}
        </div>
    );
}

function ActionLinks({equipmentId, proc, onDelete}: {
    equipmentId: string;
    proc: Procedure;
    onDelete: (eqId: string, procId: string) => void
}) {
    return (
        <div className="flex gap-3 justify-end">
            <Link
                href={`/equipment/${equipmentId}/procedures/${proc.id}/perform`}
                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium"
            >
                Perform
            </Link>
            <Link
                href={`/equipment/${equipmentId}/procedures/${proc.id}/history`}
                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
            >
                History
            </Link>
            <button
                onClick={() => onDelete(equipmentId, proc.id)}
                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium cursor-pointer"
            >
                Delete
            </button>
        </div>
    );
}
