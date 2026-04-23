import React, {useEffect, useMemo, useState} from "react";
import {Link} from "react-router-dom";
import type {DashboardItem} from "../types/equipment";
import {deleteProcedure, getDashboard, sendDashboardEmail} from "../api/client";
import {Calendar as CalendarIcon, ChevronDown, ChevronUp, List, Mail, Search, X} from "lucide-react";
import {CalendarView} from "../components";
import {Button} from "../components/ui/button";

type SortField = 'equipmentName' | 'procedureName' | 'intervalDays' | 'daysTillDue';
type SortOrder = 'asc' | 'desc';

const STORAGE_KEY = 'dashboard_settings';

const DashboardPage = (): React.JSX.Element => {
    const [items, setItems] = useState<DashboardItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').searchTerm ?? "";
        } catch {
            return "";
        }
    });
    const [sortField, setSortField] = useState<SortField>(() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').sortField ?? 'daysTillDue';
        } catch {
            return 'daysTillDue';
        }
    });
    const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').sortOrder ?? 'asc';
        } catch {
            return 'asc';
        }
    });
    const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list');
    const [emailSending, setEmailSending] = useState(false);
    const [refreshCount, setRefreshCount] = useState(0);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({searchTerm, sortField, sortOrder}));
    }, [searchTerm, sortField, sortOrder]);

    useEffect(() => {
        let cancelled = false;
        getDashboard().then((data) => {
            if (!cancelled) {
                setItems(data);
                setLoading(false);
            }
        }).catch(() => {
            if (!cancelled) setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [refreshCount]);

    const calendarEvents = useMemo(() => {
        return items
            .filter(item => item.dueDate !== null)
            .map(item => ({
                date: new Date(item.dueDate!),
                equipmentId: item.equipmentId,
                equipmentName: item.equipmentName,
                procedureId: item.procedureId,
                procedureName: item.procedureName,
                isOverdue: item.daysTillDue !== null && item.daysTillDue <= 0,
            }));
    }, [items]);

    const filteredAndSortedItems = useMemo(() => {
        let result = [...items];

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(item =>
                item.equipmentName.toLowerCase().includes(lower) ||
                item.procedureName.toLowerCase().includes(lower) ||
                (item.procedureDescription && item.procedureDescription.toLowerCase().includes(lower))
            );
        }

        result.sort((a, b) => {
            let aValue: string | number;
            let bValue: string | number;

            if (sortField === 'daysTillDue') {
                aValue = a.daysTillDue ?? Number.MAX_SAFE_INTEGER;
                bValue = b.daysTillDue ?? Number.MAX_SAFE_INTEGER;
            } else if (sortField === 'intervalDays') {
                aValue = a.intervalDays;
                bValue = b.intervalDays;
            } else {
                aValue = a[sortField].toLowerCase();
                bValue = b[sortField].toLowerCase();
            }

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

    const handleDelete = async (equipmentId: string, procedureId: string) => {
        if (confirm("Are you sure you want to delete this procedure?")) {
            await deleteProcedure(equipmentId, procedureId);
            setRefreshCount(c => c + 1);
        }
    };

    const handleEmailDashboard = async () => {
        setEmailSending(true);
        const result = await sendDashboardEmail();
        setEmailSending(false);
        if (result.success) {
            alert("Dashboard email sent successfully!");
        } else {
            alert("Failed to send dashboard email: " + result.error);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                    <h1 className="text-2xl font-bold text-[var(--foreground)]">Dashboard</h1>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleEmailDashboard}
                            disabled={emailSending}
                            className="flex items-center gap-2"
                        >
                            <Mail className="w-4 h-4"/>
                            {emailSending ? "Sending..." : "Email Dashboard"}
                        </Button>
                        <Button asChild>
                            <Link to="/equipment">Equipment</Link>
                        </Button>
                        <Button asChild>
                            <Link to="/users">Users</Link>
                        </Button>
                    </div>
                </div>

                <div className="bg-[var(--card)] shadow rounded-lg overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-[var(--muted-foreground)]">Loading...</div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex border-b border-[var(--border)]">
                                <button
                                    onClick={() => setActiveTab('list')}
                                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                                        activeTab === 'list'
                                            ? 'border-[var(--primary)] text-[var(--primary)]'
                                            : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                                    }`}
                                >
                                    <List className="w-4 h-4"/>
                                    List View
                                </button>
                                <button
                                    onClick={() => setActiveTab('calendar')}
                                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                                        activeTab === 'calendar'
                                            ? 'border-[var(--primary)] text-[var(--primary)]'
                                            : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                                    }`}
                                >
                                    <CalendarIcon className="w-4 h-4"/>
                                    Calendar View
                                </button>
                            </div>

                            {activeTab === 'list' ? (
                                <>
                                    <div className="px-4 md:px-6 pt-4">
                                        <div className="relative">
                                            <div
                                                className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Search className="h-4 w-4 text-[var(--muted-foreground)]"/>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Search procedures..."
                                                className="block w-full pl-10 pr-10 py-2 border border-[var(--border)] rounded-md leading-5 bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm transition-colors"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            {searchTerm && (
                                                <button
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                                                    onClick={() => setSearchTerm("")}
                                                >
                                                    <X className="h-4 w-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"/>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <DashboardList
                                        items={filteredAndSortedItems}
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
};

export {DashboardPage};

const DueStatus = ({item}: { item: DashboardItem }): React.JSX.Element => {
    if (item.daysTillDue === null || item.dueDate === null) {
        return <span className="text-[var(--muted-foreground)] italic text-sm">N/A</span>;
    }

    return (
        <div
            className={item.daysTillDue <= 0 ? "text-[var(--destructive)] font-bold" : "text-[var(--foreground)]"}>
            <div className="text-sm">{item.daysTillDue} days</div>
            <div className="text-xs opacity-75">({new Date(item.dueDate).toLocaleDateString()})</div>
        </div>
    );
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

const DashboardList = ({items, onDelete, sortField, sortOrder, onSort}: {
    items: DashboardItem[];
    onDelete: (eqId: string, procId: string) => void;
    sortField: SortField;
    sortOrder: SortOrder;
    onSort: (field: SortField) => void;
}): React.JSX.Element => {
    return (
        <div>
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--border)]">
                    <thead className="bg-[var(--muted)]">
                    <tr>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)]"
                            onClick={() => onSort('equipmentName')}
                        >
                            Equipment <SortIndicator field="equipmentName" sortField={sortField} sortOrder={sortOrder}/>
                        </th>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)]"
                            onClick={() => onSort('procedureName')}
                        >
                            Procedure <SortIndicator field="procedureName" sortField={sortField} sortOrder={sortOrder}/>
                        </th>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)]"
                            onClick={() => onSort('intervalDays')}
                        >
                            Interval <SortIndicator field="intervalDays" sortField={sortField} sortOrder={sortOrder}/>
                        </th>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)]"
                            onClick={() => onSort('daysTillDue')}
                        >
                            Due In <SortIndicator field="daysTillDue" sortField={sortField} sortOrder={sortOrder}/>
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-[var(--card)] divide-y divide-[var(--border)]">
                    {items.map((item) => (
                        <tr key={`${item.equipmentId}-${item.procedureId}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--foreground)]">
                                <Link to={`/equipment/${item.equipmentId}`}
                                      className="hover:underline text-[var(--primary)]">
                                    {item.equipmentName}
                                </Link>
                            </td>
                            <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                                <Link to={`/equipment/${item.equipmentId}/procedures/${item.procedureId}`}
                                      className="font-medium text-[var(--primary)] hover:underline transition-colors">
                                    {item.procedureName}
                                </Link>
                                <div className="text-xs text-[var(--muted-foreground)] line-clamp-1">{item.procedureDescription}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--foreground)]">{item.intervalDays} days</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--foreground)]">
                                <DueStatus item={item}/>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex gap-3 justify-end">
                                    <Link
                                        to={`/equipment/${item.equipmentId}/procedures/${item.procedureId}/perform`}
                                        className="text-green-500 hover:text-green-600 text-sm font-medium"
                                    >
                                        Perform
                                    </Link>
                                    <Link
                                        to={`/equipment/${item.equipmentId}/procedures/${item.procedureId}/history`}
                                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                    >
                                        History
                                    </Link>
                                    <button
                                        onClick={() => onDelete(item.equipmentId, item.procedureId)}
                                        className="text-[var(--destructive)] hover:opacity-80 text-sm font-medium cursor-pointer"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="md:hidden divide-y divide-[var(--border)]">
                {items.map((item) => (
                    <div key={`${item.equipmentId}-${item.procedureId}`} className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <Link to={`/equipment/${item.equipmentId}`}
                                      className="text-xs font-semibold text-[var(--primary)] hover:underline">
                                    {item.equipmentName}
                                </Link>
                                <Link to={`/equipment/${item.equipmentId}/procedures/${item.procedureId}`}
                                      className="hover:underline text-[var(--primary)]">
                                    <h3 className="text-sm font-bold">{item.procedureName}</h3>
                                </Link>
                            </div>
                            <DueStatus item={item}/>
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)]">
                            Interval: {item.intervalDays} days
                        </div>
                        <div className="flex flex-wrap justify-end gap-3 pt-2">
                            <Link
                                to={`/equipment/${item.equipmentId}/procedures/${item.procedureId}/perform`}
                                className="text-green-500 hover:text-green-600 text-sm font-medium"
                            >
                                Perform
                            </Link>
                            <Link
                                to={`/equipment/${item.equipmentId}/procedures/${item.procedureId}/history`}
                                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                            >
                                History
                            </Link>
                            <button
                                onClick={() => onDelete(item.equipmentId, item.procedureId)}
                                className="text-[var(--destructive)] hover:opacity-80 text-sm font-medium cursor-pointer"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {items.length === 0 && (
                <div className="py-10 text-center text-sm text-[var(--muted-foreground)]">
                    No procedures found.
                </div>
            )}
        </div>
    );
};
