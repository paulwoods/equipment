export interface Perform {
    id: string;
    date: string; // ISO date string from JSON
    notes: string;
}

export interface Procedure {
    id: string;
    name: string;
    description?: string;
    steps: string;
    requiredTools?: string;
    intervalDays: number;
    history?: Perform[];
}
