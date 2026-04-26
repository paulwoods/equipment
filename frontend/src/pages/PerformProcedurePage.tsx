import type {FormEvent} from "react";
import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {getEquipment, getProcedure, recordPerformance} from "../api/client";
import ReactMarkdown from "react-markdown";
import type {Equipment} from "../types/equipment";
import {Hash, MapPin, Tag, Wrench} from "lucide-react";
import {Button} from "../components/ui/button";

const PerformProcedurePage = (): React.JSX.Element => {
    const {id, procedureId} = useParams() as { id: string; procedureId: string };
    const navigate = useNavigate();
    const [performDate, setPerformDate] = useState(new Date().toISOString().split("T")[0]);
    const [notes, setNotes] = useState("");
    const [procedureName, setProcedureName] = useState("");
    const [procedureSteps, setProcedureSteps] = useState("");
    const [requiredTools, setRequiredTools] = useState("");
    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getEquipment(id), getProcedure(id, procedureId)])
            .then(([eq, procedure]) => {
                setEquipment(eq);
                setProcedureName(procedure.name);
                setProcedureSteps(procedure.steps || "");
                setRequiredTools(procedure.requiredTools || "");
            })
            .catch(() => setEquipment(null))
            .finally(() => setLoading(false));
    }, [id, procedureId]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        await recordPerformance(id, procedureId, performDate, notes);
        navigate(`/dashboard`);
    };

    if (loading) return <div className="p-8 text-center text-foreground">Loading...</div>;
    if (!equipment) return <div className="p-8 text-center text-foreground">Equipment not found.</div>;

    return (
        <div className="min-h-screen bg-background px-4 sm:px-6 lg:px-8">
            <div className="mx-auto">

                <div
                    className="bg-card shadow rounded-lg overflow-hidden border-border mb-6">
                    <div className="p-6 border-b border-border">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">{equipment.manufacturer} {equipment.modelNumber}</h1>
                                <p className="text-muted-foreground">Procedure: <span
                                    className="font-semibold text-foreground">{procedureName}</span></p>
                            </div>
                            <StatusBadge status={equipment.status}/>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mt-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Hash className="w-4 h-4"/>
                                <span>SN: <span
                                    className="font-medium text-foreground">{equipment.serialNumber || "N/A"}</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Tag className="w-4 h-4"/>
                                <span>Tag: <span
                                    className="font-medium text-foreground">{equipment.assetTag || "N/A"}</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="w-4 h-4"/>
                                <span className="truncate">Loc: <span
                                    className="font-medium text-foreground">{equipment.location || "N/A"}</span></span>
                            </div>
                        </div>
                    </div>

                    {requiredTools && (
                        <div
                            className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border-b border-border">
                            <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Wrench className="w-4 h-4"/>
                                Required Tools / PPE
                            </h2>
                            <div
                                className="prose prose-sm dark:prose-invert max-w-none bg-card p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                <ReactMarkdown>{requiredTools}</ReactMarkdown>
                            </div>
                        </div>
                    )}

                    {procedureSteps && (
                        <div className="p-6 bg-muted">
                            <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Procedure
                                Steps</h2>
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                                <ReactMarkdown>{procedureSteps}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit}
                      className="bg-card shadow rounded-lg p-6 border border-border">
                    <h2 className="text-xl font-bold mb-6 text-foreground">Record Performance</h2>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-foreground mb-1">Performance
                            Date</label>
                        <input
                            type="date"
                            value={performDate}
                            onChange={(e) => setPerformDate(e.target.value)}
                            required
                            className="w-full border border-border rounded-md shadow-sm p-2 text-foreground bg-card"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full border border-border rounded-md shadow-sm p-2 text-foreground bg-card"
                            rows={3}
                            placeholder="Enter any notes about this performance..."
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-green-600 hover:bg-green-700">
                            Record Performance
                        </Button>
                    </div>
                </form>
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

export {PerformProcedurePage};
