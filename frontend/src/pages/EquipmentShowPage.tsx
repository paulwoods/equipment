import React, {useEffect, useState} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import {deleteEquipment, fetchProcedures, getEquipment} from "../api/client";
import type {Equipment} from "../types/equipment";
import type {Procedure} from "../types/procedure";
import {ArrowLeft, Calendar, Hash, ListChecks, MapPin, PenSquare, Tag, Trash2} from "lucide-react";
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

    if (loading) return <div className="p-8 text-center text-[var(--foreground)]">Loading...</div>;
    if (!equipment) return <div className="p-8 text-center text-[var(--foreground)]">Equipment not found.</div>;

    return (
        <div className="min-h-screen bg-[var(--background)] py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <Link
                        to="/equipment"
                        className="text-[var(--primary)] hover:opacity-80 flex items-center gap-2 font-medium"
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
                    className="bg-[var(--card)] shadow rounded-lg overflow-hidden border border-[var(--border)]">
                    <div className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
                            <div className="grow">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-1">
                                    <h1 className="text-3xl font-bold text-[var(--foreground)]">
                                        {equipment.modelNumber}
                                    </h1>
                                    <StatusBadge status={equipment.status}/>
                                </div>
                                <p className="text-xl text-[var(--muted-foreground)] font-medium">
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
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 bg-[var(--muted)] p-6 rounded-xl border border-[var(--border)]">
                            <div className="flex items-start gap-3">
                                <div
                                    className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                    <Hash className="w-5 h-5"/>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Serial
                                        Number</p>
                                    <p className="text-sm font-medium text-[var(--foreground)]">{equipment.serialNumber || "N/A"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div
                                    className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                                    <Tag className="w-5 h-5"/>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Asset
                                        Tag</p>
                                    <p className="text-sm font-medium text-[var(--foreground)]">{equipment.assetTag || "N/A"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div
                                    className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                                    <MapPin className="w-5 h-5"/>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Location</p>
                                    <p className="text-sm font-medium text-[var(--foreground)]">{equipment.location || "N/A"}</p>
                                </div>
                            </div>
                        </div>

                        <div
                            className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-[var(--border)] pt-8">
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Description</h2>
                                    <p className="text-[var(--foreground)] leading-relaxed">
                                        {equipment.description || "No description provided."}
                                    </p>
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Purchase
                                        Date</h2>
                                    <div className="flex items-center gap-2 text-[var(--foreground)]">
                                        <Calendar className="w-4 h-4 text-[var(--muted-foreground)]"/>
                                        <span>{new Date(equipment.purchaseDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Procedures</h2>
                                    <Link
                                        to={`/equipment/${id}/procedures/new`}
                                        className="text-sm text-[var(--primary)] hover:underline font-medium"
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
                                                className="block p-3 bg-[var(--muted)] rounded-md border border-[var(--border)] hover:border-[var(--primary)] transition-colors"
                                            >
                                                <div
                                                    className="font-medium text-[var(--foreground)]">{proc.name}</div>
                                                {proc.description && (
                                                    <div
                                                        className="text-sm text-[var(--muted-foreground)] line-clamp-1">{proc.description}</div>
                                                )}
                                            </Link>
                                        ))
                                    ) : (
                                        <div
                                            className="text-sm text-[var(--muted-foreground)] italic bg-[var(--muted)] p-4 rounded-md border border-dashed border-[var(--border)] text-center">
                                            No procedures defined for this equipment.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const StatusBadge = ({status}: { status: Equipment['status'] }): React.JSX.Element => {
    const colors = {
        'Active': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        'In Use': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        'Under Repair': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        'Decommissioned': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        'In Storage': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    };

    return (
        <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || colors.Active}`}>
      {status}
    </span>
    );
};

export {EquipmentShowPage};
