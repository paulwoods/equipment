"use client";

import {FormEvent, useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import Link from "next/link";
import {addPerformanceAction, fetchEquipment} from "@/app/actions";

export default function PerformProcedurePage() {
    const {id, procedureId} = useParams() as { id: string; procedureId: string };
    const router = useRouter();
    const [performDate, setPerformDate] = useState(new Date().toISOString().split("T")[0]);
    const [notes, setNotes] = useState("");
    const [procedureName, setProcedureName] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const allEquipment = await fetchEquipment();
            const equipment = allEquipment.find((e) => e.id === id);
            const procedure = equipment?.procedures?.find((p) => p.id === procedureId);
            if (procedure) {
                setProcedureName(procedure.name);
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

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto">
                <div className="mb-6">
                    <Link
                        href={`/equipment/${id}/procedures`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2 font-medium"
                    >
                        ← Back to Procedures
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-800">
                    <h1 className="text-2xl font-bold mb-2 text-black dark:text-white">Record Performance</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Procedure: <span className="font-semibold text-black dark:text-white">{procedureName}</span>
                    </p>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Performance Date</label>
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
