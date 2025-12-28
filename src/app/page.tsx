"use client";

import { useState } from "react";
import { Equipment } from "@/types/equipment";
import EquipmentForm from "@/components/EquipmentForm";
import EquipmentList from "@/components/EquipmentList";

export default function Home() {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleAddClick = () => {
    setEditingEquipment(undefined);
    setIsFormOpen(true);
  };

  const handleEditClick = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this equipment?")) {
      setEquipmentList(equipmentList.filter((item) => item.id !== id));
    }
  };

  const handleFormSubmit = (data: Omit<Equipment, "id"> | Equipment) => {
    if ("id" in data) {
      // Update
      setEquipmentList(equipmentList.map((item) => (item.id === data.id ? (data as Equipment) : item)));
    } else {
      // Create
      const newEquipment: Equipment = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
      };
      setEquipmentList([...equipmentList, newEquipment]);
    }
    setIsFormOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Equipment Management</h1>
          {!isFormOpen && (
            <button
              onClick={handleAddClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Add Equipment
            </button>
          )}
        </div>

        {isFormOpen ? (
          <div className="mb-8">
            <EquipmentForm
              key={editingEquipment?.id || "new"}
              equipment={editingEquipment}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <EquipmentList
              items={equipmentList}
              onEdit={handleEditClick}
              onDelete={handleDelete}
            />
          </div>
        )}
      </div>
    </div>
  );
}
