export type EquipmentStatus = 'Active' | 'In Use' | 'Under Repair' | 'Decommissioned' | 'In Storage';

export interface ImportResult {
    equipmentImported: number;
    proceduresImported: number;
    historyImported: number;
}

export interface Equipment {
    id: string;
    manufacturer: string;
    modelNumber: string;
    serialNumber?: string;
    assetTag?: string;
    location?: string;
    status: EquipmentStatus;
    description?: string;
    purchaseDate: string; // ISO date string from JSON
}

export interface DashboardItem {
    equipmentId: string;
    equipmentName: string;
    procedureId: string;
    procedureName: string;
    procedureDescription: string | null;
    intervalDays: number;
    daysTillDue: number | null;
    dueDate: string | null;
    status: string;
}
