import fs from 'fs/promises';
import path from 'path';
import {Equipment} from '@/types/equipment';

const DATA_DIR = process.env.EQUIPMENT_DATA_DIR || 'data';
const DATA_FILE = path.join(process.cwd(), DATA_DIR, 'equipment.json');

async function ensureDataDir() {
    const dir = path.dirname(DATA_FILE);
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, {recursive: true});
    }
}

export async function getEquipment(): Promise<Equipment[]> {
    await ensureDataDir();
    try {
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        return parsed.map((item: { purchaseDate: string | number | Date }) => ({
            ...item,
            purchaseDate: new Date(item.purchaseDate),
        })) as Equipment[];
    } catch {
        return [];
    }
}

export async function saveEquipment(equipment: Equipment[]): Promise<void> {
    await ensureDataDir();
    await fs.writeFile(DATA_FILE, JSON.stringify(equipment, null, 2), 'utf-8');
}
