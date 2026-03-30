import type {ChangeEvent, FormEvent} from "react";
import {useMemo, useState} from "react";
import type {Procedure} from "../types/procedure";
import type {Equipment} from "../types/equipment";
import SimpleMDE from "react-simplemde-editor";

interface ProcedureFormProps {
    equipment?: Equipment;
    procedure?: Procedure;
    onSubmit: (data: Omit<Procedure, "id"> | Procedure) => void;
    onCancel: () => void;
}

export default function ProcedureForm({equipment, procedure, onSubmit, onCancel}: ProcedureFormProps) {
    const [formData, setFormData] = useState<Omit<Procedure, "id">>({
        name: procedure?.name || "",
        description: procedure?.description || "",
        steps: procedure?.steps || "",
        requiredTools: procedure?.requiredTools || "",
        intervalDays: procedure?.intervalDays || 0,
    });

    const mdeOptions = useMemo(() => {
        return {
            spellChecker: false,
            placeholder: "Enter steps here...",
            status: false,
        };
    }, []);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (procedure) {
            onSubmit({...formData, id: procedure.id} as Procedure);
        } else {
            onSubmit(formData);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        if (name === "intervalDays") {
            setFormData((prev) => ({...prev, [name]: parseInt(value) || 0}));
        } else {
            setFormData((prev) => ({...prev, [name]: value}));
        }
    };

    const handleStepsChange = (value: string) => {
        setFormData((prev) => ({...prev, steps: value}));
    };

    const handleRequiredToolsChange = (value: string) => {
        setFormData((prev) => ({...prev, requiredTools: value}));
    };

    return (
        <form onSubmit={handleSubmit}
              className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
            {equipment && (
                <div
                    className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-100 dark:border-gray-700">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Equipment
                        Details</h3>
                    <div className="flex flex-col gap-1">
                        <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {equipment.manufacturer} {equipment.modelNumber}
                        </div>
                        {equipment.description && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                {equipment.description}
                            </div>
                        )}
                    </div>
                </div>
            )}
            <h2 className="text-xl font-bold mb-4 text-black dark:text-white">{procedure ? "Edit Procedure" : "Add Procedure"}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm p-2 text-black dark:text-white dark:bg-gray-800"
                    />
                </div>

                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Interval
                        (Days)</label>
                    <input
                        type="number"
                        name="intervalDays"
                        value={formData.intervalDays}
                        onChange={handleChange}
                        required
                        min="0"
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm p-2 text-black dark:text-white dark:bg-gray-800"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm p-2 text-black dark:text-white dark:bg-gray-800"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Required Tools /
                        PPE</label>
                    <SimpleMDE
                        value={formData.requiredTools}
                        onChange={handleRequiredToolsChange}
                        options={{...mdeOptions, placeholder: 'e.g., "10mm wrench", "Multimeter", "Safety glasses"'}}
                    />
                </div>

                <div className="prose prose-sm max-w-none dark:prose-invert">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Procedure
                        Steps</label>
                    <SimpleMDE
                        value={formData.steps}
                        onChange={handleStepsChange}
                        options={mdeOptions}
                    />
                </div>
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
                    {procedure ? "Update" : "Create"}
                </button>
            </div>
        </form>
    );
}
