"use client";

import {useParams, useRouter} from "next/navigation";
import ProcedureForm from "@/components/ProcedureForm";
import {addProcedureToAction} from "@/app/actions";
import {Procedure} from "@/types/procedure";

export default function AddProcedurePage() {
    const router = useRouter();
    const {id} = useParams() as { id: string };

    const handleSubmit = async (data: Omit<Procedure, "id">) => {
        try {
            await addProcedureToAction(id, data);
            router.push(`/equipment/${id}/procedures`);
        } catch (error) {
            console.error("Failed to add procedure:", error);
            alert("Failed to add procedure.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <ProcedureForm
                    onSubmit={handleSubmit}
                    onCancel={() => router.push(`/equipment/${id}/procedures`)}
                />
            </div>
        </div>
    );
}
