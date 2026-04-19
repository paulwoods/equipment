import type {ChangeEvent, FormEvent} from "react";
import {useState} from "react";
import type {Equipment} from "../types/equipment";

interface EquipmentFormProps {
    equipment?: Equipment;
    onSubmit: (data: Omit<Equipment, "id"> | Equipment) => void;
    onCancel: () => void;
}

export default function EquipmentForm({equipment, onSubmit, onCancel}: EquipmentFormProps) {
    const [formData, setFormData] = useState({
        manufacturer: equipment?.manufacturer || "",
        modelNumber: equipment?.modelNumber || "",
        serialNumber: equipment?.serialNumber || "",
        assetTag: equipment?.assetTag || "",
        location: equipment?.location || "",
        status: equipment?.status || "Active" as Equipment["status"],
        description: equipment?.description || "",
        purchaseDate: equipment?.purchaseDate
            ? equipment.purchaseDate.split("T")[0]
            : new Date().toISOString().split("T")[0],
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (equipment) {
            onSubmit({...formData, id: equipment.id} as Equipment);
        } else {
            onSubmit(formData);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}));
    };

    return (
        <form onSubmit={handleSubmit}
              className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-bold mb-4 text-black dark:text-white">{equipment ? "Edit Equipment" : "Add Equipment"}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Manufacturer</label>
                    <input
                        type="text"
                        name="manufacturer"
                        value={formData.manufacturer}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm p-2 text-black dark:text-white dark:bg-gray-800"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Model Number</label>
                    <input
                        type="text"
                        name="modelNumber"
                        value={formData.modelNumber}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm p-2 text-black dark:text-white dark:bg-gray-800"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Serial Number</label>
                    <input
                        type="text"
                        name="serialNumber"
                        value={formData.serialNumber}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm p-2 text-black dark:text-white dark:bg-gray-800"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Asset Tag</label>
                    <input
                        type="text"
                        name="assetTag"
                        value={formData.assetTag}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm p-2 text-black dark:text-white dark:bg-gray-800"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                    <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm p-2 text-black dark:text-white dark:bg-gray-800"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm p-2 text-black dark:text-white dark:bg-gray-800"
                    >
                        <option value="Active">Active</option>
                        <option value="In Use">In Use</option>
                        <option value="Under Repair">Under Repair</option>
                        <option value="Decommissioned">Decommissioned</option>
                        <option value="In Storage">In Storage</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm p-2 text-black dark:text-white dark:bg-gray-800"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Purchase Date</label>
                <input
                    type="date"
                    name="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm p-2 text-black dark:text-white dark:bg-gray-800"
                />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t dark:border-gray-800">
                <button
                    type="button"
                    onClick={onCancel}
                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer order-2 sm:order-1"
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
