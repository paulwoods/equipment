"use client";

import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import ProcedureForm from "@/components/ProcedureForm";
import {addProcedureToAction, fetchEquipment} from "@/app/actions";
import {Procedure} from "@/types/procedure";
import {Equipment} from "@/types/equipment";

export default function AddProcedurePage() {
    const router = useRouter();
    const {id} = useParams() as { id: string };
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

    const handleSubmit = async (data: Omit<Procedure, "id">) => {
        try {
            await addProcedureToAction(id, data);
            router.push(`/equipment/${id}/procedures`);
        } catch (error) {
            console.error("Failed to add procedure:", error);
            alert("Failed to add procedure.");
        }
    };

    if (loading) return <div className="p-8 text-center text-black dark:text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <ProcedureForm
                    equipment={equipment || undefined}
                    onSubmit={handleSubmit}
                    onCancel={() => router.push(`/equipment/${id}/procedures`)}
                />
            </div>
        </div>
    );
}
