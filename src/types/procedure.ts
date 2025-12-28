export interface Perform {
  id: string;
  date: Date;
}

export interface Procedure {
  id: string;
  name: string;
  description: string;
  steps: string;
  intervalDays: number;
  history?: Perform[];
}
