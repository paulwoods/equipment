import Link from "next/link";
import { fetchEquipment } from "@/app/actions";
import { notFound } from "next/navigation";
import ProcedureManager from "@/components/ProcedureManager";

export default async function ProceduresPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const allEquipment = await fetchEquipment();
  const equipment = allEquipment.find((e) => e.id === id);

  if (!equipment) {
    notFound();
  }

  const procedures = equipment.procedures || [];

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 font-medium"
          >
            ← Back to Equipment List
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden p-6 border border-gray-200">
          <div className="mb-8 border-b border-gray-100 pb-4">
            <h1 className="text-3xl font-bold text-gray-900">Procedures</h1>
            <p className="text-gray-600 mt-2">
              For: <span className="font-semibold">{equipment.manufacturer} - {equipment.modelNumber}</span>
            </p>
          </div>

          <ProcedureManager equipmentId={id} initialProcedures={procedures} />
        </div>
      </div>
    </div>
  );
}
