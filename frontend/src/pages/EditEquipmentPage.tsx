import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import type {Equipment} from "../types/equipment";
import {BackLink, EquipmentForm, LoadingScreen, NotFoundScreen, PageContainer} from "../components";
import {getEquipment, updateEquipment} from "../api/client";

const EditEquipmentPage = (): React.JSX.Element => {
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
        return <LoadingScreen/>;
    }

    if (!equipment) {
        return <NotFoundScreen title="Equipment not found" backTo="/equipment" backLabel="Back to Equipment List"/>;
    }

    return (
        <PageContainer>
                <div className="mb-6">
                    <BackLink to="/equipment">Back to Equipment List</BackLink>
                </div>

                <EquipmentForm
                    equipment={equipment}
                    onSubmit={handleSubmit}
                    onCancel={() => navigate("/equipment")}
                />
        </PageContainer>
    );
}

export {EditEquipmentPage};
