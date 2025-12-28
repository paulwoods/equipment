import { Procedure } from "./procedure";

export interface Equipment {
  id: string;
  manufacturer: string;
  modelNumber: string;
  description: string;
  purchaseDate: Date;
  procedures?: Procedure[];
}
