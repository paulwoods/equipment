import React, {type ChangeEvent, type FormEvent, useState} from "react";
import {Link} from "react-router-dom";
import {importEquipment} from "../api/client";
import {BackLink, PageContainer} from "../components";
import type {ImportResult} from "../types/equipment";
import {Button} from "../components/ui/button";

const ImportEquipmentPage = (): React.JSX.Element => {
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
        <PageContainer>
                <div className="mb-6">
                    <BackLink to="/equipment">Back to Equipment List</BackLink>
                </div>

                <div
                    className="bg-card shadow rounded-lg p-6 border border-border">
                    <h1 className="text-2xl font-bold text-foreground mb-2">Import Equipment</h1>
                    <p className="text-sm text-muted-foreground mb-6">
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
                                <Button variant="secondary" onClick={handleReset}>
                                    Import Another File
                                </Button>
                                <Button asChild>
                                    <Link to="/equipment">View Equipment</Link>
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label
                                    htmlFor="file"
                                    className="block text-sm font-medium text-foreground mb-2"
                                >
                                    JSON File
                                </label>
                                <input
                                    id="file"
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-foreground
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-md file:border-0
                                        file:text-sm file:font-medium
                                        file:bg-blue-50 file:text-blue-700
                                        dark:file:bg-blue-900/30 dark:file:text-blue-300
                                        hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50
                                        file:cursor-pointer cursor-pointer"
                                />
                                {file && (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Selected: {file.name}
                                    </p>
                                )}
                            </div>

                            {error && (
                                <div
                                    className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                                    <p className="text-sm text-destructive">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    type="submit"
                                    disabled={!file || loading}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {loading ? 'Importing...' : 'Import'}
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link to="/equipment">Cancel</Link>
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
        </PageContainer>
    );
}

export {ImportEquipmentPage};
