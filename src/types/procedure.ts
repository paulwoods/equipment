export interface Perform {
  id: string;
  date: Date;
  notes: string;
}

export interface Procedure {
  id: string;
  name: string;
  description: string;
  steps: string;
  intervalDays: number;
  history?: Perform[];
}
