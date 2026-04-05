import {type ChangeEvent, type FormEvent, useState} from "react";
import {Link} from "react-router-dom";
import {importEquipment} from "../api/client";
import type {ImportResult} from "../types/equipment";

export default function ImportEquipmentPage() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ImportResult | null>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFile(e.target.files?.[0] ?? null);
        setError(null);
        setResult(null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!file) return;
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const importResult = await importEquipment(file);
            setResult(importResult);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Import failed';
            try {
                const parsed = JSON.parse(msg);
                setError(parsed.error ?? msg);
            } catch {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setError(null);
        setResult(null);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link
                        to="/equipment"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2 font-medium"
                    >
                        ← Back to Equipment List
                    </Link>
                </div>

                <div
                    className="bg-white dark:bg-gray-900 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-800">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Import Equipment</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        Upload a JSON file to import equipment, procedures, and history into the database.
                        All IDs in the file will be replaced with new ones.
                    </p>

                    {result ? (
                        <div className="space-y-4">
                            <div
                                className="rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
                                <h2 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">
                                    Import successful
                                </h2>
                                <ul className="text-sm text-green-700 dark:text-green-400 space-y-1 list-disc list-inside">
                                    <li>{result.equipmentImported} equipment imported</li>
                                    <li>{result.proceduresImported} procedures imported</li>
                                    <li>{result.historyImported} history records imported</li>
                                </ul>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleReset}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition text-sm"
                                >
                                    Import Another File
                                </button>
                                <Link
                                    to="/equipment"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm flex items-center"
                                >
                                    View Equipment
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label
                                    htmlFor="file"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                                >
                                    JSON File
                                </label>
                                <input
                                    id="file"
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-gray-900 dark:text-gray-100
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-md file:border-0
                                        file:text-sm file:font-medium
                                        file:bg-blue-50 file:text-blue-700
                                        dark:file:bg-blue-900/30 dark:file:text-blue-300
                                        hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50
                                        file:cursor-pointer cursor-pointer"
                                />
                                {file && (
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        Selected: {file.name}
                                    </p>
                                )}
                            </div>

                            {error && (
                                <div
                                    className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={!file || loading}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Importing...' : 'Import'}
                                </button>
                                <Link
                                    to="/equipment"
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm flex items-center"
                                >
                                    Cancel
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
