import {describe, expect, it} from 'vitest';
import {calculateDueDetails} from '../../src/lib/procedureUtils';
import type {Perform} from '../../src/types/procedure';

const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString();
};

describe('calculateDueDetails', () => {
    it('returns null when history is empty', () => {
        expect(calculateDueDetails(30, [])).toBeNull();
    });

    it('returns positive daysTillDue when performed recently', () => {
        const history: Perform[] = [{id: 'h1', date: daysAgo(5), notes: ''}];
        const result = calculateDueDetails(30, history);
        expect(result).not.toBeNull();
        expect(result!.daysTillDue).toBe(25);
    });

    it('returns zero daysTillDue when due today', () => {
        const history: Perform[] = [{id: 'h1', date: daysAgo(10), notes: ''}];
        const result = calculateDueDetails(10, history);
        expect(result!.daysTillDue).toBe(0);
    });

    it('returns negative daysTillDue when overdue', () => {
        const history: Perform[] = [{id: 'h1', date: daysAgo(10), notes: ''}];
        const result = calculateDueDetails(7, history);
        expect(result!.daysTillDue).toBe(-3);
    });

    it('uses the most recent history entry when multiple exist', () => {
        const history: Perform[] = [
            {id: 'h1', date: daysAgo(20), notes: ''},
            {id: 'h2', date: daysAgo(5), notes: ''},
            {id: 'h3', date: daysAgo(15), notes: ''},
        ];
        const result = calculateDueDetails(30, history);
        // Most recent is 5 days ago, interval is 30 → 25 days left
        expect(result!.daysTillDue).toBe(25);
    });

    it('returns a dueDate approximately intervalDays from the most recent history', () => {
        const history: Perform[] = [{id: 'h1', date: daysAgo(10), notes: ''}];
        const result = calculateDueDetails(30, history);
        const expected = new Date();
        expected.setDate(expected.getDate() + 20);
        // Compare date portion only (ignore time-of-day drift)
        expect(result!.dueDate.toDateString()).toBe(expected.toDateString());
    });
});
