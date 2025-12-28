"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Equipment } from "@/types/equipment";
import EquipmentList from "@/components/EquipmentList";
import { fetchEquipment, deleteEquipment } from "./actions";

export default function Home() {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);

  useEffect(() => {
    const loadEquipment = async () => {
      const data = await fetchEquipment();
      setEquipmentList(data);
    };
    loadEquipment();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this equipment?")) {
      await deleteEquipment(id);
      setEquipmentList(equipmentList.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Equipment Management</h1>
          <Link
            href="/equipment/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Add Equipment
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <EquipmentList
            items={equipmentList}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}
