import Link from "next/link";
import { fetchEquipment } from "@/app/actions";
import { notFound } from "next/navigation";

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

          {procedures.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 italic">No procedures defined for this equipment.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {procedures.map((proc) => (
                <div key={proc.id} className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{proc.name}</h3>
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Description</h4>
                    <p className="text-gray-700">{proc.description}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Procedure</h4>
                    <div className="text-gray-700 whitespace-pre-wrap bg-white p-3 border border-gray-100 rounded">
                      {proc.procedure}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
