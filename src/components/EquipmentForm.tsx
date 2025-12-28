"use client";

import { useState } from "react";
import { Equipment } from "@/types/equipment";

interface EquipmentFormProps {
  equipment?: Equipment;
  onSubmit: (data: Omit<Equipment, "id"> | Equipment) => void;
  onCancel: () => void;
}

export default function EquipmentForm({ equipment, onSubmit, onCancel }: EquipmentFormProps) {
  const [formData, setFormData] = useState<Omit<Equipment, "id">>(
    equipment
      ? {
          manufacturer: equipment.manufacturer,
          modelNumber: equipment.modelNumber,
          description: equipment.description,
          purchaseDate: new Date(equipment.purchaseDate),
        }
      : {
          manufacturer: "",
          modelNumber: "",
          description: "",
          purchaseDate: new Date(),
        }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (equipment) {
      onSubmit({ ...formData, id: equipment.id });
    } else {
      onSubmit(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "purchaseDate") {
      const dateValue = value ? new Date(value) : new Date();
      setFormData((prev) => ({ ...prev, [name]: isNaN(dateValue.getTime()) ? new Date() : dateValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-bold mb-4">{equipment ? "Edit Equipment" : "Add Equipment"}</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
        <input
          type="text"
          name="manufacturer"
          value={formData.manufacturer}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Model Number</label>
        <input
          type="text"
          name="modelNumber"
          value={formData.modelNumber}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
        <input
          type="date"
          name="purchaseDate"
          value={
            formData.purchaseDate instanceof Date && !isNaN(formData.purchaseDate.getTime())
              ? formData.purchaseDate.toISOString().split("T")[0]
              : ""
          }
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {equipment ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
