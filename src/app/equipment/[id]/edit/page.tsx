"use client";

import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import Link from "next/link";
import {Equipment} from "@/types/equipment";
import EquipmentForm from "@/components/EquipmentForm";
import {fetchEquipment, updateEquipment} from "@/app/actions";

export default function EditEquipmentPage() {
  const params = useParams();
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.id as string;
    const loadEquipment = async () => {
      const all = await fetchEquipment();
      const found = all.find((e) => e.id === id);
      if (found) {
        setEquipment(found);
      }
      setLoading(false);
    };
    loadEquipment();
  }, [params.id]);

  const handleSubmit = async (data: Equipment | Omit<Equipment, "id">) => {
    if ("id" in data) {
      await updateEquipment(data as Equipment);
      router.push("/equipment");
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
    );
  }

  if (!equipment) {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Equipment not found</h1>
            <Link href="/equipment" className="text-blue-600 dark:text-blue-400 hover:underline">
              Back to Equipment List
            </Link>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link
                href="/equipment"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2 font-medium"
            >
              ← Back to Equipment List
            </Link>
          </div>

          <EquipmentForm
              equipment={equipment}
              onSubmit={handleSubmit}
              onCancel={() => router.push("/equipment")}
          />
        </div>
      </div>
  );
}
