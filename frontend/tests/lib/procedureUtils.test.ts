import {describe, expect, it} from 'vitest';
import {calculateDueDetails} from '../../src/lib/procedureUtils';
import type {Procedure} from '../../src/types/procedure';

const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString();
};

describe('calculateDueDetails', () => {
    it('returns null when procedure has no history', () => {
        const proc: Procedure = {id: 'p1', name: 'Test', steps: '', intervalDays: 30};
        expect(calculateDueDetails(proc)).toBeNull();
    });

    it('returns null when history is an empty array', () => {
        const proc: Procedure = {id: 'p1', name: 'Test', steps: '', intervalDays: 30, history: []};
        expect(calculateDueDetails(proc)).toBeNull();
    });

    it('returns positive daysTillDue when performed recently', () => {
        const proc: Procedure = {
            id: 'p1', name: 'Test', steps: '', intervalDays: 30,
            history: [{id: 'h1', date: daysAgo(5), notes: ''}],
        };
        const result = calculateDueDetails(proc);
        expect(result).not.toBeNull();
        expect(result!.daysTillDue).toBe(25);
    });

    it('returns zero daysTillDue when due today', () => {
        const proc: Procedure = {
            id: 'p1', name: 'Test', steps: '', intervalDays: 10,
            history: [{id: 'h1', date: daysAgo(10), notes: ''}],
        };
        const result = calculateDueDetails(proc);
        expect(result!.daysTillDue).toBe(0);
    });

    it('returns negative daysTillDue when overdue', () => {
        const proc: Procedure = {
            id: 'p1', name: 'Test', steps: '', intervalDays: 7,
            history: [{id: 'h1', date: daysAgo(10), notes: ''}],
        };
        const result = calculateDueDetails(proc);
        expect(result!.daysTillDue).toBe(-3);
    });

    it('uses the most recent history entry when multiple exist', () => {
        const proc: Procedure = {
            id: 'p1', name: 'Test', steps: '', intervalDays: 30,
            history: [
                {id: 'h1', date: daysAgo(20), notes: ''},
                {id: 'h2', date: daysAgo(5), notes: ''},
                {id: 'h3', date: daysAgo(15), notes: ''},
            ],
        };
        const result = calculateDueDetails(proc);
        // Most recent is 5 days ago, interval is 30 → 25 days left
        expect(result!.daysTillDue).toBe(25);
    });

    it('returns a dueDate approximately intervalDays from the most recent history', () => {
        const proc: Procedure = {
            id: 'p1', name: 'Test', steps: '', intervalDays: 30,
            history: [{id: 'h1', date: daysAgo(10), notes: ''}],
        };
        const result = calculateDueDetails(proc);
        const expected = new Date();
        expected.setDate(expected.getDate() + 20);
        // Compare date portion only (ignore time-of-day drift)
        expect(result!.dueDate.toDateString()).toBe(expected.toDateString());
    });
});
