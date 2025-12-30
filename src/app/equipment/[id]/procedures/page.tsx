"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {deleteProcedureAction, fetchEquipment} from "@/app/actions";
import {Procedure} from "@/types/procedure";
import {Equipment} from "@/types/equipment";
import ProcedureList from "@/components/ProcedureList";
import {useParams} from "next/navigation";

export default function ProceduresPage() {
    const {id} = useParams() as { id: string };
    const [procedures, setProcedures] = useState<Procedure[]>([]);
    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const allEquipment = await fetchEquipment();
            const foundEquipment = allEquipment.find((e) => e.id === id);
            if (foundEquipment) {
                setProcedures(foundEquipment.procedures || []);
                setEquipment(foundEquipment);
            }
            setLoading(false);
        };
        loadData();
    }, [id]);

    const handleDelete = async (procedureId: string) => {
        if (confirm("Are you sure you want to delete this procedure?")) {
            await deleteProcedureAction(id, procedureId);
            setProcedures(procedures.filter((p) => p.id !== procedureId));
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6 flex justify-end">
                    <Link
                        href={`/equipment/${id}/procedures/new`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                        Add Procedure
                    </Link>
                </div>

                <div className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden p-6 border border-gray-200 dark:border-gray-800">
                    <div className="mb-8 border-b border-gray-100 dark:border-gray-800 pb-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
                            <div>
                                <h2 className="text-2xl font-bold text-black dark:text-white">
                                    {equipment?.manufacturer} - {equipment?.modelNumber}
                                </h2>
                                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    {equipment?.serialNumber && (
                                        <span>SN: <span className="font-medium text-gray-900 dark:text-gray-100">{equipment.serialNumber}</span></span>
                                    )}
                                    {equipment?.assetTag && (
                                        <span>Tag: <span className="font-medium text-gray-900 dark:text-gray-100">{equipment.assetTag}</span></span>
                                    )}
                                    {equipment?.location && (
                                        <span>Location: <span className="font-medium text-gray-900 dark:text-gray-100">{equipment.location}</span></span>
                                    )}
                                </div>
                            </div>
                            <div className="mt-2 sm:mt-0">
                                {equipment && <StatusBadge status={equipment.status} />}
                            </div>
                        </div>
                    </div>

                    <ProcedureList
                        equipmentId={id}
                        procedures={procedures}
                        onDelete={handleDelete}
                    />
                </div>
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
