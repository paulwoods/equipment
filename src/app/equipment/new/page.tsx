"use client";

import {useRouter} from "next/navigation";
import Link from "next/link";
import {Equipment} from "@/types/equipment";
import EquipmentForm from "@/components/EquipmentForm";
import {addEquipment} from "@/app/actions";

export default function NewEquipmentPage() {
    const router = useRouter();

    const handleSubmit = async (data: Omit<Equipment, "id"> | Equipment) => {
        if (!("id" in data)) {
            await addEquipment(data);
            router.push("/equipment");
        }
    };

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
                    onSubmit={handleSubmit}
                    onCancel={() => router.push("/equipment")}
                />
            </div>
        </div>
    );
}
