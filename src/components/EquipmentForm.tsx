"use client";

import { useState } from "react";
import { Equipment } from "@/types/equipment";
import { Procedure } from "@/types/procedure";

interface EquipmentFormProps {
  equipment?: Equipment;
  onSubmit: (data: Omit<Equipment, "id"> | Equipment) => void;
  onCancel: () => void;
}

export default function EquipmentForm({ equipment, onSubmit, onCancel }: EquipmentFormProps) {
  const [formData, setFormData] = useState<Omit<Equipment, "id">>({
    manufacturer: equipment?.manufacturer || "",
    modelNumber: equipment?.modelNumber || "",
    description: equipment?.description || "",
    purchaseDate: equipment ? new Date(equipment.purchaseDate) : new Date(),
    procedures: equipment?.procedures || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (equipment) {
      onSubmit({ ...formData, id: equipment.id } as Equipment);
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

  const addProcedure = () => {
    const newProcedure: Procedure = {
      id: Math.random().toString(36).substring(2, 9),
      name: "",
      description: "",
      procedure: "",
    };
    setFormData((prev) => ({
      ...prev,
      procedures: [...(prev.procedures || []), newProcedure],
    }));
  };

  const removeProcedure = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      procedures: (prev.procedures || []).filter((p) => p.id !== id),
    }));
  };

  const handleProcedureChange = (id: string, field: keyof Procedure, value: string) => {
    setFormData((prev) => ({
      ...prev,
      procedures: (prev.procedures || []).map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-black">{equipment ? "Edit Equipment" : "Add Equipment"}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
          <input
            type="text"
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
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
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows={3}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
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
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
        />
      </div>

      <div className="border-t pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-black">Procedures</h3>
          <button
            type="button"
            onClick={addProcedure}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            Add Procedure
          </button>
        </div>

        {formData.procedures && formData.procedures.length > 0 ? (
          <div className="space-y-4">
            {formData.procedures.map((proc) => (
              <div key={proc.id} className="p-4 border rounded-md bg-gray-50 relative">
                <button
                  type="button"
                  onClick={() => removeProcedure(proc.id)}
                  className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Name</label>
                    <input
                      type="text"
                      value={proc.name}
                      onChange={(e) => handleProcedureChange(proc.id, "name", e.target.value)}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Description</label>
                    <input
                      type="text"
                      value={proc.description}
                      onChange={(e) => handleProcedureChange(proc.id, "description", e.target.value)}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Procedure Steps</label>
                    <textarea
                      value={proc.procedure}
                      onChange={(e) => handleProcedureChange(proc.id, "procedure", e.target.value)}
                      required
                      rows={2}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-black"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No procedures added yet.</p>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
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
