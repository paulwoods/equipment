import {Procedure} from "./procedure";

export type EquipmentStatus = 'Active' | 'In Use' | 'Under Repair' | 'Decommissioned' | 'In Storage';

export interface Equipment {
    id: string;
    manufacturer: string;
    modelNumber: string;
    serialNumber?: string;
    assetTag?: string;
    location?: string;
    status: EquipmentStatus;
    description?: string;
    purchaseDate: Date;
    procedures?: Procedure[];
}
