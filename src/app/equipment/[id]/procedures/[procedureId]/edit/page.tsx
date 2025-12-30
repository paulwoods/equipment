"use client";

import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import ProcedureForm from "@/components/ProcedureForm";
import {fetchEquipment, updateProcedureAction} from "@/app/actions";
import {Procedure} from "@/types/procedure";
import {Equipment} from "@/types/equipment";

export default function EditProcedurePage() {
    const router = useRouter();
    const {id, procedureId} = useParams() as { id: string; procedureId: string };
    const [procedure, setProcedure] = useState<Procedure | null>(null);
    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProcedure = async () => {
            const allEquipment = await fetchEquipment();
            const foundEquipment = allEquipment.find((e) => e.id === id);
            if (foundEquipment) {
                setEquipment(foundEquipment);
                const proc = foundEquipment.procedures?.find((p) => p.id === procedureId);
                if (proc) {
                    setProcedure(proc);
                }
            }
            setLoading(false);
        };
        loadProcedure();
    }, [id, procedureId]);

    const handleSubmit = async (data: Procedure) => {
        try {
            await updateProcedureAction(id, data);
            router.push(`/equipment/${id}/procedures`);
        } catch (error) {
            console.error("Failed to update procedure:", error);
            alert("Failed to update procedure.");
        }
    };

    if (loading) return <div className="p-8 text-center text-black dark:text-white">Loading...</div>;
    if (!procedure) return <div className="p-8 text-center text-black dark:text-white">Procedure not found.</div>;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <ProcedureForm
                    equipment={equipment || undefined}
                    procedure={procedure}
                    onSubmit={(data) => handleSubmit(data as Procedure)}
                    onCancel={() => router.push(`/equipment/${id}/procedures`)}
                />
            </div>
        </div>
    );
}
