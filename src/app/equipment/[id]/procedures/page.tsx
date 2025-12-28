"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchEquipment, deleteProcedureAction } from "@/app/actions";
import { Procedure } from "@/types/procedure";
import ProcedureList from "@/components/ProcedureList";
import { useParams } from "next/navigation";

export default function ProceduresPage() {
  const { id } = useParams() as { id: string };
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [equipmentInfo, setEquipmentInfo] = useState({ manufacturer: "", modelNumber: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const allEquipment = await fetchEquipment();
      const equipment = allEquipment.find((e) => e.id === id);
      if (equipment) {
        setProcedures(equipment.procedures || []);
        setEquipmentInfo({ 
          manufacturer: equipment.manufacturer, 
          modelNumber: equipment.modelNumber 
        });
      }
      setLoading(false);
    };
    loadData();
  }, [id]);

  const handleDelete = async (procedureId: string) => {
    if (confirm("Are you sure you want to delete this procedure?")) {
      await deleteProcedureAction(id, procedureId);
      setProcedures(procedures.filter((p) => p.id !== procedureId));
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 font-medium"
          >
            ← Back to Equipment List
          </Link>
          <Link
            href={`/equipment/${id}/procedures/new`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Add Procedure
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden p-6 border border-gray-200">
          <div className="mb-8 border-b border-gray-100 pb-4">
            <h1 className="text-3xl font-bold text-gray-900">Procedures</h1>
            <p className="text-gray-600 mt-2">
              For: <span className="font-semibold">{equipmentInfo.manufacturer} - {equipmentInfo.modelNumber}</span>
            </p>
          </div>

          <ProcedureList 
            equipmentId={id} 
            procedures={procedures} 
            onDelete={handleDelete} 
          />
        </div>
      </div>
    </div>
  );
}
