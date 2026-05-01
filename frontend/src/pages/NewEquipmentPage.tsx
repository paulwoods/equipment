import React from "react";
import {useNavigate} from "react-router-dom";
import type {Equipment} from "../types/equipment";
import {BackLink, EquipmentForm, PageContainer} from "../components";
import {addEquipment} from "../api/client";

const NewEquipmentPage = (): React.JSX.Element => {
    const navigate = useNavigate();

    const handleSubmit = async (data: Omit<Equipment, "id"> | Equipment) => {
        if (!("id" in data)) {
            await addEquipment(data as Omit<Equipment, "id">);
            navigate("/equipment");
        }
    };

    return (
        <PageContainer>
                <div className="mb-6">
                    <BackLink to="/equipment">Back to Equipment List</BackLink>
                </div>

                <EquipmentForm
                    onSubmit={handleSubmit}
                    onCancel={() => navigate("/equipment")}
                />
        </PageContainer>
    );
}

export {NewEquipmentPage};
