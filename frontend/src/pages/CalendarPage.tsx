import React, {useEffect, useMemo, useState} from "react";
import type {DashboardItem} from "../types/equipment";
import {getDashboard} from "../api/client";
import {CalendarView, PageContainer, PageLoader} from "../components";

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
        <PageContainer>
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
                </div>
                <div className="bg-card shadow rounded-lg overflow-hidden">
                    {loading ? (
                        <PageLoader/>
                    ) : (
                        <div className="p-4 md:p-6">
                            <CalendarView events={calendarEvents}/>
                        </div>
                    )}
                </div>
        </PageContainer>
    );
};

export {CalendarPage};
