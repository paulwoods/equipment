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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Till Due</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {procedures.map((proc) => {
            const calculateDueDetails = () => {
              if (!proc.history || proc.history.length === 0) return null;
              
              const latestDate = new Date(Math.max(...proc.history.map(h => new Date(h.date).getTime())));
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              latestDate.setHours(0, 0, 0, 0);
              
              const diffTime = today.getTime() - latestDate.getTime();
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              
              const daysTillDue = proc.intervalDays - diffDays;
              const dueDate = new Date(today);
              dueDate.setDate(today.getDate() + daysTillDue);
              
              return { daysTillDue, dueDate };
            };

            const dueDetails = calculateDueDetails();

            return (
              <tr key={proc.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{proc.name}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{proc.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{proc.intervalDays}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {dueDetails ? (
                    <div className={dueDetails.daysTillDue <= 0 ? "text-red-600 font-bold" : "text-gray-900"}>
                      <div>
                        {dueDetails.daysTillDue}
                      </div>
                      <div className="text-xs opacity-75">
                        ({dueDetails.dueDate.toLocaleDateString()})
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/equipment/${equipmentId}/procedures/${proc.id}/perform`}
                    className="text-green-600 hover:text-green-900 mr-4"
                  >
                    Perform
                  </Link>
                  <Link
                    href={`/equipment/${equipmentId}/procedures/${proc.id}/history`}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    History
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
            );
          })}
          {procedures.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                No procedures found for this equipment.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
