import type {Procedure} from "../types/procedure";

export function calculateDueDetails(proc: Procedure) {
    if (!proc.history || proc.history.length === 0) return null;

    const latestDate = new Date(Math.max(...proc.history.map(h => new Date(h.date).getTime())));
    const today = new Date();

    const diffTime = today.getTime() - latestDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const daysTillDue = proc.intervalDays - diffDays;
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + daysTillDue);

    return {daysTillDue, dueDate};
}
