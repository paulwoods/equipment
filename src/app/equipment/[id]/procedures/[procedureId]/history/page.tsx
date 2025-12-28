"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {useParams} from "next/navigation";
import {fetchEquipment} from "@/app/actions";
import {Procedure} from "@/types/procedure";

export default function ProcedureHistoryPage() {
    const {id, procedureId} = useParams() as { id: string; procedureId: string };
    const [procedure, setProcedure] = useState<Procedure | null>(null);
    const [equipmentInfo, setEquipmentInfo] = useState({manufacturer: "", modelNumber: ""});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const allEquipment = await fetchEquipment();
            const equipment = allEquipment.find((e) => e.id === id);
            if (equipment) {
                setEquipmentInfo({
                    manufacturer: equipment.manufacturer,
                    modelNumber: equipment.modelNumber,
                });
                const proc = equipment.procedures?.find((p) => p.id === procedureId);
                if (proc) {
                    setProcedure(proc);
                }
            }
            setLoading(false);
        };
        loadData();
    }, [id, procedureId]);

    if (loading) return <div className="p-8 text-center text-black">Loading...</div>;
    if (!procedure) return <div className="p-8 text-center text-black">Procedure not found.</div>;

    const history = procedure.history || [];

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link
                        href={`/equipment/${id}/procedures`}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-2 font-medium"
                    >
                        ← Back to Procedures
                    </Link>
                </div>

                <div className="bg-white shadow rounded-lg overflow-hidden p-6 border border-gray-200">
                    <div className="mb-8 border-b border-gray-100 pb-4">
                        <h1 className="text-3xl font-bold text-gray-900">Performance History</h1>
                        <p className="text-gray-600 mt-2">
                            Procedure: <span className="font-semibold">{procedure.name}</span>
                        </p>
                        <p className="text-gray-600">
                            Equipment: <span
                            className="font-semibold">{equipmentInfo.manufacturer} - {equipmentInfo.modelNumber}</span>
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date Performed
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Notes
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {history.length > 0 ? (
                                history
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map((record) => (
                                        <tr key={record.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(record.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {record.notes || <span className="text-gray-400 italic">No notes</span>}
                                            </td>
                                        </tr>
                                    ))
                            ) : (
                                <tr>
                                    <td colSpan={2} className="px-6 py-10 text-center text-sm text-gray-500">
                                        No performance records found for this procedure.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
