import {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {fetchHistory, getEquipment, getProcedure} from "../api/client";
import type {Perform, Procedure} from "../types/procedure";

export default function ProcedureHistoryPage() {
    const {id, procedureId} = useParams() as { id: string; procedureId: string };
    const [procedure, setProcedure] = useState<Procedure | null>(null);
    const [history, setHistory] = useState<Perform[]>([]);
    const [equipmentInfo, setEquipmentInfo] = useState({manufacturer: "", modelNumber: ""});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getEquipment(id),
            getProcedure(id, procedureId),
            fetchHistory(id, procedureId),
        ]).then(([equipment, proc, hist]) => {
            setEquipmentInfo({manufacturer: equipment.manufacturer, modelNumber: equipment.modelNumber});
            setProcedure(proc);
            setHistory(hist);
        }).catch(() => setProcedure(null))
            .finally(() => setLoading(false));
    }, [id, procedureId]);

    if (loading) return <div className="p-8 text-center text-black dark:text-white">Loading...</div>;
    if (!procedure) return <div className="p-8 text-center text-black dark:text-white">Procedure not found.</div>;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">

                <div
                    className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden p-6 border border-gray-200 dark:border-gray-800">
                    <div className="mb-8 border-b border-gray-100 dark:border-gray-800 pb-4">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Performance History</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Procedure: <span
                            className="font-semibold text-black dark:text-white">{procedure.name}</span>
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                            Equipment: <span
                            className="font-semibold text-black dark:text-white">{equipmentInfo.manufacturer} - {equipmentInfo.modelNumber}</span>
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="hidden md:table min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                            <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Date Performed
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Notes
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                            {history.length > 0 ? (
                                [...history]
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map((record) => (
                                        <tr key={record.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {new Date(record.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                                                {record.notes || <span className="text-gray-400 italic">No notes</span>}
                                            </td>
                                        </tr>
                                    ))
                            ) : (
                                <tr>
                                    <td colSpan={2}
                                        className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                        No performance records found for this procedure.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>

                        <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-800">
                            {history.length > 0 ? (
                                [...history]
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map((record) => (
                                        <div key={record.id} className="py-4 space-y-2">
                                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                {new Date(record.date).toLocaleDateString()}
                                            </div>
                                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                                {record.notes || <span className="text-gray-400 italic">No notes</span>}
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                    No performance records found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
