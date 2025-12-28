"use client";

import { useState } from "react";
import { Procedure } from "@/types/procedure";

interface ProcedureFormProps {
  procedure?: Procedure;
  onSubmit: (data: Omit<Procedure, "id"> | Procedure) => void;
  onCancel: () => void;
}

export default function ProcedureForm({ procedure, onSubmit, onCancel }: ProcedureFormProps) {
  const [formData, setFormData] = useState<Omit<Procedure, "id">>({
    name: procedure?.name || "",
    description: procedure?.description || "",
    procedure: procedure?.procedure || "",
    intervalDays: procedure?.intervalDays || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (procedure) {
      onSubmit({ ...formData, id: procedure.id } as Procedure);
    } else {
      onSubmit(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "intervalDays") {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-black">{procedure ? "Edit Procedure" : "Add Procedure"}</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Interval (Days)</label>
        <input
          type="number"
          name="intervalDays"
          value={formData.intervalDays}
          onChange={handleChange}
          required
          min="0"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Procedure Steps</label>
        <textarea
          name="procedure"
          value={formData.procedure}
          onChange={handleChange}
          required
          rows={5}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
        />
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
          {procedure ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
