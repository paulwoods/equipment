import React, {useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import type {UserRole} from "../types/user";
import {assignableRoles} from "../types/user";
import {createUser} from "../api/client";
import {useAuth} from "../hooks";
import {Button} from "../components/ui/button";

const NewUserPage = (): React.JSX.Element => {
    const navigate = useNavigate();
    const {role: callerRole} = useAuth();
    const roleOptions = assignableRoles(callerRole);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('USER');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await createUser({name, email, password, role});
            navigate('/users');
        } catch {
            setError('Failed to create user. The email may already be in use.');
        } finally {
            setSubmitting(false);
        }
    };

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
                    <h1 className="text-xl font-bold text-[var(--foreground)] mb-6">New User</h1>

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
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                Role
                            </label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as UserRole)}
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            >
                                {roleOptions.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button type="submit" disabled={submitting}>
                                {submitting ? 'Creating...' : 'Create User'}
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

export {NewUserPage};
