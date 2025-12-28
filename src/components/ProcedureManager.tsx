"use client";

import { useState } from "react";
import { Procedure } from "@/types/procedure";
import { updateProcedures } from "@/app/actions";

interface ProcedureManagerProps {
  equipmentId: string;
  initialProcedures: Procedure[];
}

export default function ProcedureManager({ equipmentId, initialProcedures }: ProcedureManagerProps) {
  const [procedures, setProcedures] = useState<Procedure[]>(initialProcedures);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const addProcedure = () => {
    const newProcedure: Procedure = {
      id: Math.random().toString(36).substring(2, 9),
      name: "",
      description: "",
      procedure: "",
    };
    setProcedures((prev) => [...prev, newProcedure]);
  };

  const removeProcedure = (id: string) => {
    setProcedures((prev) => prev.filter((p) => p.id !== id));
  };

  const handleProcedureChange = (id: string, field: keyof Procedure, value: string) => {
    setProcedures((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");
    try {
      await updateProcedures(equipmentId, procedures);
      setMessage("Procedures saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Failed to save procedures.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-black">Manage Procedures</h2>
        <button
          onClick={addProcedure}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          Add Procedure
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded ${message.includes("failed") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {message}
        </div>
      )}

      {procedures.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500 italic">No procedures defined. Click &quot;Add Procedure&quot; to start.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {procedures.map((proc) => (
            <div key={proc.id} className="p-4 border rounded-md bg-white shadow-sm relative border-gray-200">
              <button
                type="button"
                onClick={() => removeProcedure(proc.id)}
                className="absolute top-2 right-2 text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Remove
              </button>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Name</label>
                  <input
                    type="text"
                    value={proc.name}
                    onChange={(e) => handleProcedureChange(proc.id, "name", e.target.value)}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Description</label>
                  <input
                    type="text"
                    value={proc.description}
                    onChange={(e) => handleProcedureChange(proc.id, "description", e.target.value)}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Procedure Steps</label>
                  <textarea
                    value={proc.procedure}
                    onChange={(e) => handleProcedureChange(proc.id, "procedure", e.target.value)}
                    required
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isSaving ? "Saving..." : "Save All Procedures"}
        </button>
      </div>
    </div>
  );
}
