"use client";

import {Equipment} from "@/types/equipment";
import Link from "next/link";

interface EquipmentListProps {
  items: Equipment[];
  onDelete: (id: string) => void;
}

export default function EquipmentList({items, onDelete}: EquipmentListProps) {
  return (
      <div>
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Manufacturer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Model
                Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Procedures</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.manufacturer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.modelNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{item.description}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    <ProcedureBadge item={item}/>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                        href={`/equipment/${item.id}/edit`}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                    >
                      Edit
                    </Link>
                    <button
                        onClick={() => onDelete(item.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
            ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-800">
          {items.map((item) => (
              <div key={item.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.manufacturer}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.modelNumber}</p>
                  </div>
                  <ProcedureBadge item={item}/>
                </div>
                {item.description && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">{item.description}</p>
                )}
                <div className="flex justify-end gap-4 pt-2">
                  <Link
                      href={`/equipment/${item.id}/edit`}
                      className="text-sm text-blue-600 dark:text-blue-400 font-medium"
                  >
                    Edit
                  </Link>
                  <button
                      onClick={() => onDelete(item.id)}
                      className="text-sm text-red-600 dark:text-red-400 font-medium cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
          ))}
        </div>

        {items.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              No equipment found. Add some to get started!
            </div>
        )}
      </div>
  );
}

function ProcedureBadge({item}: { item: Equipment }) {
  if (item.procedures && item.procedures.length > 0) {
    return (
        <Link
            href={`/equipment/${item.id}/procedures`}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
        >
          {item.procedures.length} {item.procedures.length === 1 ? 'procedure' : 'procedures'}
        </Link>
    );
  }
  return (
      <Link
          href={`/equipment/${item.id}/procedures/new`}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        0 procedures
      </Link>
  );
}
