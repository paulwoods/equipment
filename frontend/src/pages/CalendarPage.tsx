import React, {useEffect, useMemo, useState} from "react";
import type {DashboardItem} from "../types/equipment";
import {getDashboard} from "../api/client";
import {CalendarView} from "../components";

const CalendarPage = (): React.JSX.Element => {
    const [items, setItems] = useState<DashboardItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        getDashboard().then((data) => {
            if (!cancelled) {
                setItems(data);
                setLoading(false);
            }
        }).catch(() => {
            if (!cancelled) setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    const calendarEvents = useMemo(() => {
        return items
            .filter(item => item.dueDate !== null)
            .map(item => ({
                date: new Date(item.dueDate!),
                equipmentId: item.equipmentId,
                equipmentName: item.equipmentName,
                procedureId: item.procedureId,
                procedureName: item.procedureName,
                isOverdue: item.daysTillDue !== null && item.daysTillDue <= 0,
            }));
    }, [items]);

    return (
        <div className="min-h-screen bg-[var(--background)] px-4 sm:px-6 lg:px-8">
            <div className="mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-[var(--foreground)]">Calendar</h1>
                </div>
                <div className="bg-[var(--card)] shadow rounded-lg overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-[var(--muted-foreground)]">Loading...</div>
                    ) : (
                        <div className="p-4 md:p-6">
                            <CalendarView events={calendarEvents}/>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export {CalendarPage};
