import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {ProcedureForm} from "../components";
import {addProcedure, getEquipment} from "../api/client";
import type {Procedure} from "../types/procedure";
import type {Equipment} from "../types/equipment";

const NewProcedurePage = (): React.JSX.Element => {
    const navigate = useNavigate();
    const {id} = useParams() as { id: string };
    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getEquipment(id)
            .then(setEquipment)
            .catch(() => setEquipment(null))
            .finally(() => setLoading(false));
    }, [id]);

    const handleSubmit = async (data: Omit<Procedure, "id"> | Procedure) => {
        try {
            await addProcedure(id, data as Omit<Procedure, "id">);
            navigate(`/equipment/${id}/procedures`);
        } catch (error) {
            console.error("Failed to add procedure:", error);
            alert("Failed to add procedure.");
        }
    };

    if (loading) return <div className="p-8 text-center text-[var(--foreground)]">Loading...</div>;

    return (
        <div className="min-h-screen bg-[var(--background)] py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <ProcedureForm
                    equipment={equipment || undefined}
                    onSubmit={handleSubmit}
                    onCancel={() => navigate(`/equipment/${id}/procedures`)}
                />
            </div>
        </div>
    );
}

export {NewProcedurePage};
