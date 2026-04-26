import React, {useEffect, useState} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import type {Equipment} from "../types/equipment";
import {EquipmentForm} from "../components";
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
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (!equipment) {
        return (
            <div className="min-h-screen bg-background py-8 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-2xl font-bold text-foreground mb-4">Equipment not found</h1>
                    <Link to="/equipment" className="text-primary hover:underline">
                        Back to Equipment List
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background px-4 sm:px-6 lg:px-8">
            <div className="mx-auto">
                <div className="mb-6">
                    <Link
                        to="/equipment"
                        className="text-primary hover:opacity-80 flex items-center gap-2 font-medium"
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

export {EditEquipmentPage};
