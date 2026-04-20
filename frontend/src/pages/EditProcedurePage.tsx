import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {ProcedureForm} from "../components";
import {getEquipment, getProcedure, updateProcedure} from "../api/client";
import type {Procedure} from "../types/procedure";
import type {Equipment} from "../types/equipment";

const EditProcedurePage = (): React.JSX.Element => {
    const navigate = useNavigate();
    const {id, procedureId} = useParams() as { id: string; procedureId: string };
    const [procedure, setProcedure] = useState<Procedure | null>(null);
    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getEquipment(id), getProcedure(id, procedureId)])
            .then(([eq, proc]) => {
                setEquipment(eq);
                setProcedure(proc);
            })
            .catch(() => setEquipment(null))
            .finally(() => setLoading(false));
    }, [id, procedureId]);

    const handleSubmit = async (data: Omit<Procedure, "id"> | Procedure) => {
        try {
            const {id: procId, ...rest} = data as Procedure;
            await updateProcedure(id, procId, rest as Omit<Procedure, "id">);
            navigate(`/equipment/${id}/procedures`);
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
                    onSubmit={handleSubmit}
                    onCancel={() => navigate(`/equipment/${id}/procedures`)}
                />
            </div>
        </div>
    );
}

export {EditProcedurePage};
