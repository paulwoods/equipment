import {useEffect, useState} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import type {Equipment} from "../types/equipment";
import EquipmentForm from "../components/EquipmentForm";
import {getEquipment, updateEquipment} from "../api/client";

export default function EditEquipmentPage() {
    const {id} = useParams() as { id: string };
    const navigate = useNavigate();
    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getEquipment(id)
            .then(setEquipment)
            .catch(() => setEquipment(null))
            .finally(() => setLoading(false));
    }, [id]);

    const handleSubmit = async (data: Equipment | Omit<Equipment, "id">) => {
        if ("id" in data) {
            const {id: equipId, ...rest} = data as Equipment;
            await updateEquipment(equipId, rest as Omit<Equipment, "id">);
            navigate("/equipment");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
                <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
        );
    }

    if (!equipment) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Equipment not found</h1>
                    <Link to="/equipment" className="text-blue-600 dark:text-blue-400 hover:underline">
                        Back to Equipment List
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link
                        to="/equipment"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2 font-medium"
                    >
                        ← Back to Equipment List
                    </Link>
                </div>

                <EquipmentForm
                    equipment={equipment}
                    onSubmit={handleSubmit}
                    onCancel={() => navigate("/equipment")}
                />
            </div>
        </div>
    );
}
