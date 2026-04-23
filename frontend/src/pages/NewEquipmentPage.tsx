import React from "react";
import {Link, useNavigate} from "react-router-dom";
import type {Equipment} from "../types/equipment";
import {EquipmentForm} from "../components";
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
        <div className="min-h-screen bg-[var(--background)] py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link
                        to="/equipment"
                        className="text-[var(--primary)] hover:opacity-80 flex items-center gap-2 font-medium"
                    >
                        ← Back to Equipment List
                    </Link>
                </div>

                <EquipmentForm
                    onSubmit={handleSubmit}
                    onCancel={() => navigate("/equipment")}
                />
            </div>
        </div>
    );
}

export {NewEquipmentPage};
