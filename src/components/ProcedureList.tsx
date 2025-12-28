"use client";

import {Procedure} from "@/types/procedure";
import Link from "next/link";

interface ProcedureListProps {
    equipmentId: string;
    procedures: Procedure[];
    onDelete: (id: string) => void;
}

export default function ProcedureList({equipmentId, procedures, onDelete}: ProcedureListProps) {
    return (
        <div>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interval
                            (Days)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days
                            Till Due
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {procedures.map((proc) => {
                        const dueDetails = calculateDueDetails(proc);

                        return (
                            <tr key={proc.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{proc.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">{proc.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{proc.intervalDays}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-gray-200">
                {procedures.map((proc) => {
                    const dueDetails = calculateDueDetails(proc);
                    return (
                        <div key={proc.id} className="py-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900">{proc.name}</h3>
                                    {proc.description && (
                                        <p className="text-sm text-gray-600 line-clamp-2">{proc.description}</p>
                                    )}
                                </div>
                                <DueStatus details={dueDetails}/>
                            </div>
                            <div className="text-xs text-gray-500">
                                Interval: {proc.intervalDays} days
                            </div>
                            <div className="flex flex-wrap justify-end gap-3 pt-2">
                                <ActionLinks equipmentId={equipmentId} proc={proc} onDelete={onDelete}/>
                            </div>
                        </div>
                    );
                })}
            </div>

            {procedures.length === 0 && (
                <div className="py-10 text-center text-sm text-gray-500">
                    No procedures found for this equipment.
                </div>
            )}
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
        <div className={details.daysTillDue <= 0 ? "text-red-600 font-bold" : "text-gray-900"}>
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
                href={`/equipment/${equipmentId}/procedures/${proc.id}/perform`}
                className="text-green-600 hover:text-green-900 text-sm font-medium mr-4 md:mr-4 last:mr-0"
            >
                Perform
            </Link>
            <Link
                href={`/equipment/${equipmentId}/procedures/${proc.id}/history`}
                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium mr-4 md:mr-4 last:mr-0"
            >
                History
            </Link>
            <Link
                href={`/equipment/${equipmentId}/procedures/${proc.id}/edit`}
                className="text-blue-600 hover:text-blue-900 text-sm font-medium mr-4 md:mr-4 last:mr-0"
            >
                Edit
            </Link>
            <button
                onClick={() => onDelete(proc.id)}
                className="text-red-600 hover:text-red-900 text-sm font-medium cursor-pointer"
            >
                Delete
            </button>
        </>
    );
}
