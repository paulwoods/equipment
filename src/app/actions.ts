"use server";

import { revalidatePath } from "next/cache";
import { Equipment } from "@/types/equipment";
import { getEquipment, saveEquipment } from "@/lib/equipmentStore";

export async function fetchEquipment() {
  return await getEquipment();
}

export async function addEquipment(data: Omit<Equipment, "id">) {
  const equipment = await getEquipment();
  const newEquipment: Equipment = {
    ...data,
    id: Math.random().toString(36).substring(2, 9),
  };
  equipment.push(newEquipment);
  await saveEquipment(equipment);
  revalidatePath("/");
  return newEquipment;
}

export async function updateEquipment(data: Equipment) {
  const equipment = await getEquipment();
  const index = equipment.findIndex((item) => item.id === data.id);
  if (index !== -1) {
    equipment[index] = data;
    await saveEquipment(equipment);
    revalidatePath("/");
    return data;
  }
  throw new Error("Equipment not found");
}

export async function deleteEquipment(id: string) {
  const equipment = await getEquipment();
  const filtered = equipment.filter((item) => item.id !== id);
  await saveEquipment(filtered);
  revalidatePath("/");
}
