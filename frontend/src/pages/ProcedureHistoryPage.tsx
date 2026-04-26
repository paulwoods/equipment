import React, {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {fetchHistory, getEquipment, getProcedure} from "../api/client";
import type {Perform, Procedure} from "../types/procedure";

const ProcedureHistoryPage = (): React.JSX.Element => {
    const {id, procedureId} = useParams() as { id: string; procedureId: string };
    const [procedure, setProcedure] = useState<Procedure | null>(null);
    const [history, setHistory] = useState<Perform[]>([]);
    const [equipmentInfo, setEquipmentInfo] = useState({manufacturer: "", modelNumber: ""});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getEquipment(id),
            getProcedure(id, procedureId),
            fetchHistory(id, procedureId),
        ]).then(([equipment, proc, hist]) => {
            setEquipmentInfo({manufacturer: equipment.manufacturer, modelNumber: equipment.modelNumber});
            setProcedure(proc);
            setHistory(hist);
        }).catch(() => setProcedure(null))
            .finally(() => setLoading(false));
    }, [id, procedureId]);

    if (loading) return <div className="p-8 text-center text-foreground">Loading...</div>;
    if (!procedure) return <div className="p-8 text-center text-foreground">Procedure not found.</div>;

    return (
        <div className="min-h-screen bg-background px-4 sm:px-6 lg:px-8">
            <div className="mx-auto">

                <div
                    className="bg-card shadow rounded-lg overflow-hidden p-6 border-border">
                    <div className="mb-8 border-b border-border pb-4">
                        <h1 className="text-3xl font-bold text-foreground">Performance History</h1>
                        <p className="text-muted-foreground mt-2">
                            Procedure: <span
                            className="font-semibold text-foreground">{procedure.name}</span>
                        </p>
                        <p className="text-muted-foreground">
                            Equipment: <span
                            className="font-semibold text-foreground">{equipmentInfo.manufacturer} - {equipmentInfo.modelNumber}</span>
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="hidden md:table min-w-full divide-y divide-border">
                            <thead className="bg-muted">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Date Performed
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Notes
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-border">
                            {history.length > 0 ? (
                                [...history]
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map((record) => (
                                        <tr key={record.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                                {new Date(record.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-foreground">
                                                {record.notes ||
                                                  <span className="text-muted-foreground italic">No notes</span>}
                                            </td>
                                        </tr>
                                    ))
                            ) : (
                                <tr>
                                    <td colSpan={2}
                                        className="px-6 py-10 text-center text-sm text-muted-foreground">
                                        No performance records found for this procedure.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>

                        <div className="md:hidden divide-y divide-border">
                            {history.length > 0 ? (
                                [...history]
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map((record) => (
                                        <div key={record.id} className="py-4 space-y-2">
                                            <div className="text-sm font-bold text-foreground">
                                                {new Date(record.date).toLocaleDateString()}
                                            </div>
                                            <div className="text-sm text-foreground">
                                                {record.notes ||
                                                  <span className="text-muted-foreground italic">No notes</span>}
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <div className="py-10 text-center text-sm text-muted-foreground">
                                    No performance records found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export {ProcedureHistoryPage};
