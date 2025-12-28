"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {Equipment} from "@/types/equipment";
import {Procedure} from "@/types/procedure";
import {fetchEquipment, deleteProcedureAction} from "../actions";

interface FlattenedProcedure extends Procedure {
    equipmentId: string;
    equipmentName: string;
}

export default function Dashboard() {
    const [procedures, setProcedures] = useState<FlattenedProcedure[]>([]);
    const [loading, setLoading] = useState(true);

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

        // Sort by days till due (ascending)
        flattened.sort((a, b) => {
            const dueA = calculateDueDetails(a)?.daysTillDue ?? Infinity;
            const dueB = calculateDueDetails(b)?.daysTillDue ?? Infinity;
            return dueA - dueB;
        });

        setProcedures(flattened);
        setLoading(false);
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
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Procedure Dashboard</h1>
                    <Link
                        href="/"
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
                    >
                        Equipment
                    </Link>
                </div>

                <div className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading...</div>
                    ) : (
                        <DashboardList procedures={procedures} onDelete={handleDelete} />
                    )}
                </div>
            </div>
        </div>
    );
}

function calculateDueDetails(proc: Procedure) {
    if (!proc.history || proc.history.length === 0) return null;

    const latestDate = new Date(Math.max(...proc.history.map(h => new Date(h.date).getTime())));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    latestDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - latestDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const daysTillDue = proc.intervalDays - diffDays;
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + daysTillDue);

    return {daysTillDue, dueDate};
}

function DueStatus({details}: { details: ReturnType<typeof calculateDueDetails> }) {
    if (!details) return <span className="text-gray-400 italic text-sm">N/A</span>;

    return (
        <div className={details.daysTillDue <= 0 ? "text-red-600 dark:text-red-400 font-bold" : "text-gray-900 dark:text-gray-100"}>
            <div className="text-sm">
                {details.daysTillDue} days
            </div>
            <div className="text-xs opacity-75">
                ({details.dueDate.toLocaleDateString()})
            </div>
        </div>
    );
}

function DashboardList({procedures, onDelete}: { 
    procedures: FlattenedProcedure[], 
    onDelete: (eqId: string, procId: string) => void 
}) {
    return (
        <div>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Equipment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Procedure</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Interval</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Due In</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {procedures.map((proc) => {
                        const dueDetails = calculateDueDetails(proc);

                        return (
                            <tr key={`${proc.equipmentId}-${proc.id}`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                    <Link href={`/equipment/${proc.equipmentId}`} className="hover:underline text-blue-600 dark:text-blue-400">
                                        {proc.equipmentName}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                                    <div className="font-medium text-gray-900 dark:text-gray-100">{proc.name}</div>
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
                                    <Link href={`/equipment/${proc.equipmentId}`} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                                        {proc.equipmentName}
                                    </Link>
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{proc.name}</h3>
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
