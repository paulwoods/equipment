"use client";

import { Procedure } from "@/types/procedure";
import Link from "next/link";

interface ProcedureListProps {
  equipmentId: string;
  procedures: Procedure[];
  onDelete: (id: string) => void;
}

export default function ProcedureList({ equipmentId, procedures, onDelete }: ProcedureListProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interval (Days)</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {procedures.map((proc) => (
            <tr key={proc.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{proc.name}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{proc.description}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{proc.intervalDays}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Link
                  href={`/equipment/${equipmentId}/procedures/${proc.id}/perform`}
                  className="text-green-600 hover:text-green-900 mr-4"
                >
                  Perform
                </Link>
                <Link
                  href={`/equipment/${equipmentId}/procedures/${proc.id}/edit`}
                  className="text-blue-600 hover:text-blue-900 mr-4"
                >
                  Edit
                </Link>
                <button
                  onClick={() => onDelete(proc.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {procedures.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">
                No procedures found for this equipment.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
