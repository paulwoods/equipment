export interface Perform {
  id: string;
  date: Date;
}

export interface Procedure {
  id: string;
  name: string;
  description: string;
  procedure: string;
  intervalDays: number;
  history?: Perform[];
}
