import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {PageContainer, PageLoader, ProcedureForm} from "../components";
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

    if (loading) return <PageLoader/>;

    return (
        <PageContainer>
                <ProcedureForm
                    equipment={equipment || undefined}
                    onSubmit={handleSubmit}
                    onCancel={() => navigate(`/equipment/${id}/procedures`)}
                />
        </PageContainer>
    );
}

export {NewProcedurePage};
