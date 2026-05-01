import React, {useEffect, useMemo, useState} from "react";
import {Link} from "react-router-dom";
import type {DashboardItem} from "../types/equipment";
import {deleteProcedure, getDashboard, sendDashboardEmail} from "../api/client";
import {Mail} from "lucide-react";
import {PageContainer, PageLoader, SearchInput, SortIndicator} from "../components";
import {Button} from "../components/ui/button";
import {type SortOrder, useSort} from "../hooks";

type SortField = 'equipmentName' | 'procedureName' | 'intervalDays' | 'daysTillDue';

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
    const initialSortField = (() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').sortField ?? 'daysTillDue';
        } catch {
            return 'daysTillDue';
        }
    })();
    const initialSortOrder = (() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').sortOrder ?? 'asc';
        } catch {
            return 'asc';
        }
    })();
    const {sortField, sortOrder, handleSort} = useSort<SortField>(initialSortField, initialSortOrder);
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
        <PageContainer>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                    <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
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

                <div className="bg-card shadow rounded-lg overflow-hidden">
                    {loading ? (
                        <PageLoader/>
                    ) : (
                        <div className="space-y-4">
                            <div className="px-4 md:px-6 pt-4">
                                <SearchInput
                                    value={searchTerm}
                                    onChange={setSearchTerm}
                                    placeholder="Search procedures..."
                                />
                            </div>
                            <DashboardList
                                items={filteredAndSortedItems}
                                onDelete={handleDelete}
                                sortField={sortField}
                                sortOrder={sortOrder}
                                onSort={handleSort}
                            />
                        </div>
                    )}
                </div>
        </PageContainer>
    );
};

export {DashboardPage};

const DueStatus = ({item}: { item: DashboardItem }): React.JSX.Element => {
    if (item.daysTillDue === null || item.dueDate === null) {
        return <span className="text-muted-foreground italic text-sm">N/A</span>;
    }

    return (
        <div
            className={item.daysTillDue <= 0 ? "text-destructive font-bold" : "text-foreground"}>
            <div className="text-sm">{item.daysTillDue} days</div>
            <div className="text-xs opacity-75">({new Date(item.dueDate).toLocaleDateString()})</div>
        </div>
    );
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
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                    <tr>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                            onClick={() => onSort('equipmentName')}
                        >
                            Equipment <SortIndicator field="equipmentName" sortField={sortField} sortOrder={sortOrder}/>
                        </th>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                            onClick={() => onSort('procedureName')}
                        >
                            Procedure <SortIndicator field="procedureName" sortField={sortField} sortOrder={sortOrder}/>
                        </th>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                            onClick={() => onSort('intervalDays')}
                        >
                            Interval <SortIndicator field="intervalDays" sortField={sortField} sortOrder={sortOrder}/>
                        </th>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                            onClick={() => onSort('daysTillDue')}
                        >
                            Due In <SortIndicator field="daysTillDue" sortField={sortField} sortOrder={sortOrder}/>
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                    {items.map((item) => (
                        <tr key={`${item.equipmentId}-${item.procedureId}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                <Link to={`/equipment/${item.equipmentId}`}
                                      className="hover:underline text-primary">
                                    {item.equipmentName}
                                </Link>
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground">
                                <Link to={`/equipment/${item.equipmentId}/procedures/${item.procedureId}`}
                                      className="font-medium text-primary hover:underline transition-colors">
                                    {item.procedureName}
                                </Link>
                                <div
                                    className="text-xs text-muted-foreground line-clamp-1">{item.procedureDescription}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{item.intervalDays} days</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
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
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="md:hidden divide-y divide-border">
                {items.map((item) => (
                    <div key={`${item.equipmentId}-${item.procedureId}`} className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <Link to={`/equipment/${item.equipmentId}`}
                                      className="text-xs font-semibold text-primary hover:underline">
                                    {item.equipmentName}
                                </Link>
                                <Link to={`/equipment/${item.equipmentId}/procedures/${item.procedureId}`}
                                      className="hover:underline text-primary">
                                    <h3 className="text-sm font-bold">{item.procedureName}</h3>
                                </Link>
                            </div>
                            <DueStatus item={item}/>
                        </div>
                        <div className="text-xs text-muted-foreground">
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
                                className="text-destructive hover:opacity-80 text-sm font-medium cursor-pointer"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {items.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">
                    No procedures found.
                </div>
            )}
        </div>
    );
};
