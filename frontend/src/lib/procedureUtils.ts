import type {Perform} from "../types/procedure";

export function calculateDueDetails(intervalDays: number, history: Perform[]) {
    if (!history || history.length === 0) return null;

    const latestDate = new Date(Math.max(...history.map((h: Perform) => new Date(h.date).getTime())));
    const today = new Date();

    const diffTime = today.getTime() - latestDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const daysTillDue = intervalDays - diffDays;
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + daysTillDue);

    return {daysTillDue, dueDate};
}
