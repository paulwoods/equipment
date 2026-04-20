import React, {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import type {Equipment} from "../types/equipment";
import {EquipmentList} from "../components";
import {deleteEquipment, exportEquipment, fetchEquipment} from "../api/client";

const EquipmentPage = (): React.JSX.Element => {
    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchEquipment()
            .then(setEquipmentList)
            .catch(() => setError("Failed to load equipment."))
            .finally(() => setLoading(false));
    }, []);

    const handleExport = async (): Promise<void> => {
        await exportEquipment();
    };

    const handleDelete = async (id: string): Promise<void> => {
        if (confirm("Are you sure you want to delete this equipment?")) {
            await deleteEquipment(id);
            setEquipmentList(equipmentList.filter((item) => item.id !== id));
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-600 dark:text-red-400">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Equipment</h1>
                    <div className="flex gap-4">
                        <button
                            onClick={handleExport}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                        >
                            Export
                        </button>
                        <Link
                            to="/dashboard"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                        >
                            Dashboard
                        </Link>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden">
                    <EquipmentList
                        items={equipmentList}
                        onDelete={handleDelete}
                    />
                </div>
            </div>
        </div>
    );
};

export {EquipmentPage};
