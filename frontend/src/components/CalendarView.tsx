import React, {useMemo, useState} from "react";
import {ChevronLeft, ChevronRight, Info} from "lucide-react";
import {Link} from "react-router-dom";

interface CalendarEvent {
    date: Date;
    equipmentId: string;
    equipmentName: string;
    procedureId: string;
    procedureName: string;
    isOverdue: boolean;
}

interface CalendarViewProps {
    events: CalendarEvent[];
}

export const CalendarView = ({events}: CalendarViewProps): React.JSX.Element => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = (year: number, month: number): number => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number): number => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const prevMonth = (): void => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = (): void => setCurrentDate(new Date(year, month + 1, 1));
    const goToToday = (): void => setCurrentDate(new Date());

    const monthName = currentDate.toLocaleString('default', {month: 'long'});

    const calendarDays = useMemo(() => {
        const totalDays = daysInMonth(year, month);
        const startDay = firstDayOfMonth(year, month);
        const days = [];

        for (let i = 0; i < startDay; i++) {
            days.push({day: null, month: month - 1, year});
        }

        for (let i = 1; i <= totalDays; i++) {
            days.push({day: i, month: month, year});
        }

        return days;
    }, [year, month]);

    const getEventsForDate = (day: number | null, m: number, y: number): CalendarEvent[] => {
        if (day === null) return [];
        return events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getDate() === day &&
                eventDate.getMonth() === m &&
                eventDate.getFullYear() === y;
        });
    };

    const isToday = (day: number | null, m: number, y: number): boolean => {
        const today = new Date();
        return day === today.getDate() &&
            m === today.getMonth() &&
            y === today.getFullYear();
    };

    return (
        <div className="bg-card rounded-lg shadow overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-foreground">
                        {monthName} {year}
                    </h2>
                    <button
                        onClick={goToToday}
                        className="px-3 py-1 text-sm font-medium bg-muted text-foreground rounded hover:opacity-80 transition"
                    >
                        Today
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={prevMonth}
                        className="p-2 hover:bg-muted rounded-full transition text-muted-foreground"
                    >
                        <ChevronLeft className="w-5 h-5"/>
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-muted rounded-full transition text-muted-foreground"
                    >
                        <ChevronRight className="w-5 h-5"/>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 border-b border-border">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day}
                         className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)]">
                {calendarDays.map((dateObj, idx) => {
                    const dateEvents = getEventsForDate(dateObj.day, dateObj.month, dateObj.year);
                    const isCurrentToday = isToday(dateObj.day, dateObj.month, dateObj.year);

                    return (
                        <div
                            key={idx}
                            className={`p-2 border-b border-r border-border min-h-30 ${
                                dateObj.day === null ? 'bg-muted/30' : ''
                            }`}
                        >
                            {dateObj.day && (
                                <>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`text-sm font-medium ${
                                            isCurrentToday
                                                ? 'bg-primary text-primary-foreground w-7 h-7 flex items-center justify-center rounded-full'
                                                : 'text-foreground'
                                        }`}>
                                            {dateObj.day}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        {dateEvents.map((event, eventIdx) => (
                                            <Link
                                                key={eventIdx}
                                                to={`/equipment/${event.equipmentId}/procedures/${event.procedureId}`}
                                                className={`block p-1 text-[10px] leading-tight rounded border transition ${
                                                    event.isOverdue
                                                        ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-destructive hover:bg-red-100 dark:hover:bg-red-900/30'
                                                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 text-primary hover:bg-blue-100 dark:hover:bg-blue-900/30'
                                                }`}
                                                title={`${event.equipmentName}: ${event.procedureName}`}
                                            >
                                                <div className="font-bold truncate">{event.equipmentName}</div>
                                                <div className="truncate">{event.procedureName}</div>
                                            </Link>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            <div
                className="p-4 bg-muted border-t border-border flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                    <div
                        className="w-3 h-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded"></div>
                    <span className="text-muted-foreground">Scheduled</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div
                        className="w-3 h-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded"></div>
                    <span className="text-muted-foreground">Overdue</span>
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                    <Info className="w-3 h-3 text-muted-foreground"/>
                    <span className="text-muted-foreground italic">Click on a procedure to view details</span>
                </div>
            </div>
        </div>
    );
};
