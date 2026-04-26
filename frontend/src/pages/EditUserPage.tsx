import React, {useEffect, useState} from "react";
import axios from "axios";
import {Link, useNavigate, useParams} from "react-router-dom";
import type {User, UserRole} from "../types/user";
import {assignableRoles} from "../types/user";
import {getUser, updateUser} from "../api/client";
import {useAuth} from "../hooks";
import {Button} from "../components/ui/button";

const EditUserPage = (): React.JSX.Element => {
    const {id} = useParams() as { id: string };
    const navigate = useNavigate();
    const {role: callerRole, userId} = useAuth();
    const isSelfEdit = userId !== null && userId === id;
    const roleOptions = assignableRoles(callerRole);

    const [user, setUser] = useState<User | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<UserRole>('USER');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        getUser(id)
            .then((data) => {
                setUser(data);
                setName(data.name);
                setEmail(data.email);
                setRole(data.role);
            })
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, [id]);

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await updateUser(id, {name, email, role});
            navigate('/users');
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.data?.detail) {
                setError(err.response.data.detail);
            } else {
                setError('Failed to update user. The email may already be in use.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <p className="text-[var(--muted-foreground)]">Loading...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[var(--background)] py-8 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">User not found</h1>
                    <Link to="/users" className="text-[var(--primary)] hover:underline">
                        Back to Users
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] px-4 sm:px-6 lg:px-8">
            <div className="mx-auto">
                <div className="mb-6">
                    <Link
                        to="/users"
                        className="text-[var(--primary)] hover:opacity-80 flex items-center gap-2 font-medium"
                    >
                        ← Back to Users
                    </Link>
                </div>

                <div className="bg-[var(--card)] shadow rounded-lg p-6">
                    <h1 className="text-xl font-bold text-[var(--foreground)] mb-6">Edit User</h1>

                    {error && (
                        <div
                            className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-[var(--destructive)] rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                Role
                            </label>
                            {isSelfEdit ? (
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        role === 'SYSTEM_ADMIN'
                                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                            : role === 'ADMIN'
                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                : role === 'EDIT'
                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                    }`}>
                                    {role}
                                </span>
                            ) : (
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as UserRole)}
                                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                >
                                    {roleOptions.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button type="submit" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => navigate('/users')}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export {EditUserPage};
