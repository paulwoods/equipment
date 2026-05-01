import React, {useEffect, useState} from "react";
import {Link, useParams} from "react-router-dom";
import {fetchHistory, getEquipment, getProcedure} from "../api/client";
import {NotFoundScreen} from "../components";
import type {Perform, Procedure} from "../types/procedure";
import type {Equipment} from "../types/equipment";
import ReactMarkdown from "react-markdown";
import {Calendar, Clock, Edit, FileText, History, Play, Wrench} from "lucide-react";
import {Button} from "../components/ui/button";

const ProcedureShowPage = (): React.JSX.Element => {
    const {id, procedureId} = useParams() as { id: string; procedureId: string };
    const [procedure, setProcedure] = useState<Procedure | null>(null);
    const [history, setHistory] = useState<Perform[]>([]);
    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getEquipment(id), getProcedure(id, procedureId), fetchHistory(id, procedureId)])
            .then(([eq, proc, hist]) => {
                setEquipment(eq);
                setProcedure(proc);
                setHistory(hist);
            })
            .catch(() => setEquipment(null))
            .finally(() => setLoading(false));
    }, [id, procedureId]);

    if (loading) return <div className="p-8 text-center text-foreground">Loading...</div>;
    if (!procedure || !equipment) return <NotFoundScreen title="Procedure not found" backTo="/dashboard"
                                                         backLabel="Back to Dashboard"/>;

    const lastPerformed = history.length > 0
        ? new Date(Math.max(...history.map((h: Perform) => new Date(h.date).getTime())))
        : null;

    return (
        <div className="min-h-screen bg-background px-4 sm:px-6 lg:px-8">
            <div className="mx-auto">
                <div className="mb-6 flex justify-end gap-3">
                    <Button variant="outline" asChild>
                        <Link to={`/equipment/${id}/procedures/${procedureId}/edit`}>
                            <Edit className="w-4 h-4 mr-2"/>
                            Edit
                        </Link>
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-700" asChild>
                        <Link to={`/equipment/${id}/procedures/${procedureId}/perform`}>
                            <Play className="w-4 h-4 mr-2"/>
                            Perform
                        </Link>
                    </Button>
                </div>

                <div
                    className="bg-card shadow-lg rounded-xl overflow-hidden border border-border">
                    <div className="p-6 md:p-8 border-b border-border">
                        <div className="flex flex-col gap-1 mb-4">
                            <span
                                className="text-xs font-semibold text-primary uppercase tracking-wider">Procedure Details</span>
                            <h1 className="text-3xl font-bold text-foreground">{procedure.name}</h1>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            <div className="flex items-start gap-3">
                                <div
                                    className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                    <FileText className="w-5 h-5"/>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Equipment</p>
                                    <p className="text-sm font-semibold text-foreground">{equipment.manufacturer} {equipment.modelNumber}</p>
                                    {(equipment.serialNumber || equipment.assetTag) && (
                                        <p className="text-xs text-muted-foreground">
                                            {equipment.serialNumber && `SN: ${equipment.serialNumber}`}
                                            {equipment.serialNumber && equipment.assetTag && " | "}
                                            {equipment.assetTag && `Tag: ${equipment.assetTag}`}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div
                                    className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                    <Clock className="w-5 h-5"/>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Interval</p>
                                    <p className="text-sm font-semibold text-foreground">Every {procedure.intervalDays} days</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div
                                    className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                                    <Calendar className="w-5 h-5"/>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Last
                                        Performed</p>
                                    <p className="text-sm font-semibold text-foreground">
                                        {lastPerformed ? lastPerformed.toLocaleDateString() : "Never"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div
                                    className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                                    <History className="w-5 h-5"/>
                                </div>
                                <div>
                                    <Link
                                        to={`/equipment/${id}/procedures/${procedureId}/history`}
                                        className="text-sm font-semibold text-primary hover:underline"
                                    >
                                        View Full History
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 md:p-8 space-y-8">
                        {procedure.description && (
                            <div>
                                <h2 className="text-lg font-bold text-foreground mb-2">Description</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    {procedure.description}
                                </p>
                            </div>
                        )}

                        {procedure.requiredTools && (
                            <div>
                                <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                                    <Wrench className="w-5 h-5 text-primary"/>
                                    Required Tools / PPE
                                </h2>
                                <div
                                    className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-4 rounded-lg prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown>
                                        {procedure.requiredTools}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        )}

                        <div>
                            <h2 className="text-lg font-bold text-foreground mb-4">Procedure Steps</h2>
                            <div
                                className="prose prose-sm md:prose-base max-w-none dark:prose-invert bg-muted p-6 rounded-xl border border-border">
                                <ReactMarkdown>{procedure.steps || "_No steps provided._"}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export {ProcedureShowPage};
