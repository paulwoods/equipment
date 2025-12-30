"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {useParams, useRouter} from "next/navigation";
import {deleteEquipment, fetchEquipment} from "@/app/actions";
import {Equipment} from "@/types/equipment";
import {ArrowLeft, Calendar, Hash, ListChecks, MapPin, PenSquare, Tag, Trash2} from "lucide-react";

export default function EquipmentShowPage() {
    const {id} = useParams() as { id: string };
    const router = useRouter();
    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadEquipment = async () => {
            const allEquipment = await fetchEquipment();
            const found = allEquipment.find(e => e.id === id);
            if (found) {
                setEquipment(found);
            }
            setLoading(false);
        };
        loadEquipment();
    }, [id]);

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this equipment?")) {
            await deleteEquipment(id);
            router.push("/equipment");
        }
    };

    if (loading) return <div className="p-8 text-center text-black dark:text-white">Loading...</div>;
    if (!equipment) return <div className="p-8 text-center text-black dark:text-white">Equipment not found.</div>;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <Link
                        href="/equipment"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2 font-medium"
                    >
                        <ArrowLeft className="w-4 h-4"/> Back to Equipment List
                    </Link>
                    <div className="flex gap-3">
                        <Link
                            href={`/equipment/${id}/edit`}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                            <PenSquare className="w-4 h-4"/> Edit
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 transition cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4"/> Delete
                        </button>
                    </div>
                </div>

                <div
                    className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
                    <div className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
                            <div className="grow">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-1">
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {equipment.modelNumber}
                                    </h1>
                                    <StatusBadge status={equipment.status}/>
                                </div>
                                <p className="text-xl text-gray-600 dark:text-gray-400 font-medium">
                                    {equipment.manufacturer}
                                </p>
                            </div>
                            <Link
                                href={`/equipment/${id}/procedures`}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition shadow-sm font-medium"
                            >
                                <ListChecks className="w-5 h-5"/> View Procedures
                            </Link>
                        </div>

                        <div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-800">
                            <div className="flex items-start gap-3">
                                <div
                                    className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                    <Hash className="w-5 h-5"/>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Serial
                                        Number</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{equipment.serialNumber || "N/A"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div
                                    className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                                    <Tag className="w-5 h-5"/>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Asset
                                        Tag</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{equipment.assetTag || "N/A"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div
                                    className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                                    <MapPin className="w-5 h-5"/>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{equipment.location || "N/A"}</p>
                                </div>
                            </div>
                        </div>

                        <div
                            className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-100 dark:border-gray-800 pt-8">
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Description</h2>
                                    <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
                                        {equipment.description || "No description provided."}
                                    </p>
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Purchase
                                        Date</h2>
                                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                        <Calendar className="w-4 h-4 text-gray-400"/>
                                        <span>{new Date(equipment.purchaseDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Procedures</h2>
                                    <Link
                                        href={`/equipment/${id}/procedures/new`}
                                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                    >
                                        + Add New
                                    </Link>
                                </div>
                                <div className="space-y-3">
                                    {equipment.procedures && equipment.procedures.length > 0 ? (
                                        equipment.procedures.map(proc => (
                                            <Link
                                                key={proc.id}
                                                href={`/equipment/${id}/procedures/${proc.id}`}
                                                className="block p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-900 transition-colors"
                                            >
                                                <div
                                                    className="font-medium text-gray-900 dark:text-gray-100">{proc.name}</div>
                                                {proc.description && (
                                                    <div
                                                        className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{proc.description}</div>
                                                )}
                                            </Link>
                                        ))
                                    ) : (
                                        <div
                                            className="text-sm text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/50 p-4 rounded-md border border-dashed border-gray-200 dark:border-gray-700 text-center">
                                            No procedures defined for this equipment.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
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
        <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || colors.Active}`}>
      {status}
    </span>
    );
}
