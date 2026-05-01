import React, {useEffect, useState} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import {deleteEquipment, fetchProcedures, getEquipment} from "../api/client";
import type {Equipment} from "../types/equipment";
import type {Procedure} from "../types/procedure";
import {ArrowLeft, Calendar, Hash, ListChecks, MapPin, PenSquare, Tag, Trash2} from "lucide-react";
import {PageContainer, PageLoader, StatusBadge} from "../components";
import {Button} from "../components/ui/button";

const EquipmentShowPage = (): React.JSX.Element => {
    const {id} = useParams() as { id: string };
    const navigate = useNavigate();
    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [procedures, setProcedures] = useState<Procedure[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getEquipment(id), fetchProcedures(id)])
            .then(([eq, procs]) => {
                setEquipment(eq);
                setProcedures(procs);
            })
            .catch(() => setEquipment(null))
            .finally(() => setLoading(false));
    }, [id]);

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this equipment?")) {
            await deleteEquipment(id);
            navigate("/equipment");
        }
    };

    if (loading) return <PageLoader/>;
    if (!equipment) return <div className="p-8 text-center text-foreground">Equipment not found.</div>;

    return (
        <PageContainer>
                <div className="mb-6 flex justify-between items-center">
                    <Link
                        to="/equipment"
                        className="text-primary hover:opacity-80 flex items-center gap-2 font-medium"
                    >
                        <ArrowLeft className="w-4 h-4"/> Back to Equipment List
                    </Link>
                    <div className="flex gap-3">
                        <Button variant="outline" asChild>
                            <Link to={`/equipment/${id}/edit`}>
                                <PenSquare className="w-4 h-4 mr-2"/> Edit
                            </Link>
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            <Trash2 className="w-4 h-4 mr-2"/> Delete
                        </Button>
                    </div>
                </div>

                <div
                    className="bg-card shadow rounded-lg overflow-hidden border border-border">
                    <div className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
                            <div className="grow">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-1">
                                    <h1 className="text-3xl font-bold text-foreground">
                                        {equipment.modelNumber}
                                    </h1>
                                    <StatusBadge status={equipment.status}/>
                                </div>
                                <p className="text-xl text-muted-foreground font-medium">
                                    {equipment.manufacturer}
                                </p>
                            </div>
                            <Button asChild>
                                <Link to={`/equipment/${id}/procedures`}>
                                    <ListChecks className="w-5 h-5 mr-2"/> View Procedures
                                </Link>
                            </Button>
                        </div>

                        <div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 bg-muted p-6 rounded-xl border border-border">
                            <div className="flex items-start gap-3">
                                <div
                                    className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                    <Hash className="w-5 h-5"/>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Serial
                                        Number</p>
                                    <p className="text-sm font-medium text-foreground">{equipment.serialNumber || "N/A"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div
                                    className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                                    <Tag className="w-5 h-5"/>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Asset
                                        Tag</p>
                                    <p className="text-sm font-medium text-foreground">{equipment.assetTag || "N/A"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div
                                    className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                                    <MapPin className="w-5 h-5"/>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</p>
                                    <p className="text-sm font-medium text-foreground">{equipment.location || "N/A"}</p>
                                </div>
                            </div>
                        </div>

                        <div
                            className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-border pt-8">
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</h2>
                                    <p className="text-foreground leading-relaxed">
                                        {equipment.description || "No description provided."}
                                    </p>
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Purchase
                                        Date</h2>
                                    <div className="flex items-center gap-2 text-foreground">
                                        <Calendar className="w-4 h-4 text-muted-foreground"/>
                                        <span>{new Date(equipment.purchaseDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Procedures</h2>
                                    <Link
                                        to={`/equipment/${id}/procedures/new`}
                                        className="text-sm text-primary hover:underline font-medium"
                                    >
                                        + Add New
                                    </Link>
                                </div>
                                <div className="space-y-3">
                                    {procedures.length > 0 ? (
                                        procedures.map(proc => (
                                            <Link
                                                key={proc.id}
                                                to={`/equipment/${id}/procedures/${proc.id}`}
                                                className="block p-3 bg-muted rounded-md border border-border hover:border-primary transition-colors"
                                            >
                                                <div
                                                    className="font-medium text-foreground">{proc.name}</div>
                                                {proc.description && (
                                                    <div
                                                        className="text-sm text-muted-foreground line-clamp-1">{proc.description}</div>
                                                )}
                                            </Link>
                                        ))
                                    ) : (
                                        <div
                                            className="text-sm text-muted-foreground italic bg-muted p-4 rounded-md border border-dashed border-border text-center">
                                            No procedures defined for this equipment.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
        </PageContainer>
    );
}

export {EquipmentShowPage};
