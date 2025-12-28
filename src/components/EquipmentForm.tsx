"use client";

import React, {ChangeEvent, FormEvent, useState} from "react";
import {Equipment} from "@/types/equipment";

interface EquipmentFormProps {
    equipment?: Equipment;
    onSubmit: (data: Omit<Equipment, "id"> | Equipment) => void;
    onCancel: () => void;
}

export default function EquipmentForm({equipment, onSubmit, onCancel}: EquipmentFormProps) {
    const [formData, setFormData] = useState<Omit<Equipment, "id">>({
        manufacturer: equipment?.manufacturer || "",
        modelNumber: equipment?.modelNumber || "",
        description: equipment?.description || "",
        purchaseDate: equipment ? new Date(equipment.purchaseDate) : new Date(),
        procedures: equipment?.procedures || [],
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (equipment) {
            onSubmit({...formData, id: equipment.id} as Equipment);
        } else {
            onSubmit(formData);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        if (name === "purchaseDate") {
            const dateValue = value ? new Date(value) : new Date();
            setFormData((prev) => ({...prev, [name]: isNaN(dateValue.getTime()) ? new Date() : dateValue}));
        } else {
            setFormData((prev) => ({...prev, [name]: value}));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-bold mb-4 text-black">{equipment ? "Edit Equipment" : "Add Equipment"}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
                    <input
                        type="text"
                        name="manufacturer"
                        value={formData.manufacturer}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Model Number</label>
                    <input
                        type="text"
                        name="modelNumber"
                        value={formData.modelNumber}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
                <input
                    type="date"
                    name="purchaseDate"
                    value={
                        !isNaN(formData.purchaseDate.getTime())
                            ? formData.purchaseDate.toISOString().split("T")[0]
                            : ""
                    }
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
                />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <button
                    type="button"
                    onClick={onCancel}
                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 cursor-pointer order-2 sm:order-1"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer order-1 sm:order-2"
                >
                    {equipment ? "Update" : "Create"}
                </button>
            </div>
        </form>
    );
}
