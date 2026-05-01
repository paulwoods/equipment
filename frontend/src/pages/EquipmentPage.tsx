import React, {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import type {Equipment} from "../types/equipment";
import {EquipmentList, PageContainer, PageLoader} from "../components";
import {deleteEquipment, exportEquipment, fetchEquipment} from "../api/client";
import {Button} from "../components/ui/button";

const EquipmentPage = (): React.JSX.Element => {
    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchEquipment()
            .then(setEquipmentList)
            .catch(() => setError("Failed to load equipment."))
            .finally(() => setLoading(false));
    }, []);

    const handleExport = async (): Promise<void> => {
        await exportEquipment();
    };

    const handleDelete = async (id: string): Promise<void> => {
        if (confirm("Are you sure you want to delete this equipment?")) {
            await deleteEquipment(id);
            setEquipmentList(equipmentList.filter((item) => item.id !== id));
        }
    };

    if (loading) return <PageLoader/>;
    if (error) return <div className="p-8 text-center text-destructive">{error}</div>;

    return (
        <PageContainer>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                    <h1 className="text-2xl font-bold text-foreground">Equipment</h1>
                    <div className="flex gap-4">
                        <Button onClick={handleExport}>
                            Export
                        </Button>
                        <Button asChild>
                            <Link to="/dashboard">Dashboard</Link>
                        </Button>
                        <Button asChild>
                            <Link to="/users">Users</Link>
                        </Button>
                    </div>
                </div>

                <div className="bg-card shadow rounded-lg overflow-hidden">
                    <EquipmentList
                        items={equipmentList}
                        onDelete={handleDelete}
                    />
                </div>
        </PageContainer>
    );
};

export {EquipmentPage};
