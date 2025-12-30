"use client";

import {FormEvent, useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {addPerformanceAction, fetchEquipment} from "@/app/actions";
import ReactMarkdown from "react-markdown";
import {Equipment} from "@/types/equipment";
import {Hash, Tag, MapPin} from "lucide-react";

export default function PerformProcedurePage() {
    const {id, procedureId} = useParams() as { id: string; procedureId: string };
    const router = useRouter();
    const [performDate, setPerformDate] = useState(new Date().toISOString().split("T")[0]);
    const [notes, setNotes] = useState("");
    const [procedureName, setProcedureName] = useState("");
    const [procedureSteps, setProcedureSteps] = useState("");
    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const allEquipment = await fetchEquipment();
            const foundEquipment = allEquipment.find((e) => e.id === id);
            if (foundEquipment) {
                setEquipment(foundEquipment);
                const procedure = foundEquipment.procedures?.find((p) => p.id === procedureId);
                if (procedure) {
                    setProcedureName(procedure.name);
                    setProcedureSteps(procedure.steps || "");
                }
            }
            setLoading(false);
        };
        loadData();
    }, [id, procedureId]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        await addPerformanceAction(id, procedureId, new Date(performDate), notes);
        router.push(`/equipment/${id}/procedures`);
    };

    if (loading) return <div className="p-8 text-center text-black dark:text-white">Loading...</div>;
    if (!equipment) return <div className="p-8 text-center text-black dark:text-white">Equipment not found.</div>;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">

                <div className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 mb-6">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-black dark:text-white">{equipment.manufacturer} {equipment.modelNumber}</h1>
                                <p className="text-gray-600 dark:text-gray-400">Procedure: <span className="font-semibold text-black dark:text-white">{procedureName}</span></p>
                            </div>
                            <StatusBadge status={equipment.status} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mt-4">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Hash className="w-4 h-4" />
                                <span>SN: <span className="font-medium text-gray-900 dark:text-gray-100">{equipment.serialNumber || "N/A"}</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Tag className="w-4 h-4" />
                                <span>Tag: <span className="font-medium text-gray-900 dark:text-gray-100">{equipment.assetTag || "N/A"}</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <MapPin className="w-4 h-4" />
                                <span className="truncate">Loc: <span className="font-medium text-gray-900 dark:text-gray-100">{equipment.location || "N/A"}</span></span>
                            </div>
                        </div>
                    </div>

                    {procedureSteps && (
                        <div className="p-6 bg-gray-50 dark:bg-gray-800/50">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Procedure Steps</label>
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                                <ReactMarkdown>{procedureSteps}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit}
                      className="bg-white dark:bg-gray-900 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-800">
                    <h2 className="text-xl font-bold mb-6 text-black dark:text-white">Record Performance</h2>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Performance
                            Date</label>
                        <input
                            type="date"
                            value={performDate}
                            onChange={(e) => setPerformDate(e.target.value)}
                            required
                            className="w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm p-2 text-black dark:text-white dark:bg-gray-800"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm p-2 text-black dark:text-white dark:bg-gray-800"
                            rows={3}
                            placeholder="Enter any notes about this performance..."
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                        >
                            Record Performance
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function StatusBadge({status}: { status: Equipment['status'] }) {
    const colors = {
        'Active': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        'In Use': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        'Under Repair': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        'Decommissioned': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        'In Storage': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    };

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || colors.Active}`}>
      {status}
    </span>
    );
}
