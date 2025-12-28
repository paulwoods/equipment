"use server";

import { revalidatePath } from "next/cache";
import { Equipment } from "@/types/equipment";
import { Procedure } from "@/types/procedure";
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

export async function updateProcedures(equipmentId: string, procedures: Procedure[]) {
  const equipment = await getEquipment();
  const index = equipment.findIndex((item) => item.id === equipmentId);
  if (index !== -1) {
    equipment[index].procedures = procedures;
    await saveEquipment(equipment);
    revalidatePath("/");
    revalidatePath(`/equipment/${equipmentId}/procedures`);
    return equipment[index];
  }
  throw new Error("Equipment not found");
}

export async function addProcedureToAction(equipmentId: string, procedureData: Omit<Procedure, "id">) {
  const allEquipment = await getEquipment();
  const equipmentIndex = allEquipment.findIndex((e) => e.id === equipmentId);
  if (equipmentIndex === -1) throw new Error("Equipment not found");

  const newProcedure: Procedure = {
    ...procedureData,
    id: Math.random().toString(36).substring(2, 9),
  };

  if (!allEquipment[equipmentIndex].procedures) {
    allEquipment[equipmentIndex].procedures = [];
  }
  allEquipment[equipmentIndex].procedures!.push(newProcedure);

  await saveEquipment(allEquipment);
  revalidatePath("/");
  revalidatePath(`/equipment/${equipmentId}/procedures`);
  return newProcedure;
}

export async function updateProcedureAction(equipmentId: string, procedure: Procedure) {
  const allEquipment = await getEquipment();
  const equipmentIndex = allEquipment.findIndex((e) => e.id === equipmentId);
  if (equipmentIndex === -1) throw new Error("Equipment not found");

  const procedures = allEquipment[equipmentIndex].procedures || [];
  const procedureIndex = procedures.findIndex((p) => p.id === procedure.id);
  
  if (procedureIndex === -1) throw new Error("Procedure not found");

  procedures[procedureIndex] = procedure;
  allEquipment[equipmentIndex].procedures = procedures;

  await saveEquipment(allEquipment);
  revalidatePath("/");
  revalidatePath(`/equipment/${equipmentId}/procedures`);
  return procedure;
}

export async function deleteProcedureAction(equipmentId: string, procedureId: string) {
  const allEquipment = await getEquipment();
  const equipmentIndex = allEquipment.findIndex((e) => e.id === equipmentId);
  if (equipmentIndex === -1) throw new Error("Equipment not found");

  allEquipment[equipmentIndex].procedures = (allEquipment[equipmentIndex].procedures || [])
    .filter((p) => p.id !== procedureId);

  await saveEquipment(allEquipment);
  revalidatePath("/");
  revalidatePath(`/equipment/${equipmentId}/procedures`);
}
