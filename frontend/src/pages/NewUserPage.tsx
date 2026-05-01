import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import type {UserRole} from "../types/user";
import {assignableRoles} from "../types/user";
import {BackLink} from "../components";
import {createUser} from "../api/client";
import {useAuth} from "../hooks";
import {Button} from "../components/ui/button";

const NewUserPage = (): React.JSX.Element => {
    const navigate = useNavigate();
    const {roles: callerRoles} = useAuth();
    const roleOptions = assignableRoles(callerRoles);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(['USER']);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const toggleRole = (role: UserRole) => {
        setSelectedRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await createUser({name, email, password, roles: selectedRoles});
            navigate('/users');
        } catch {
            setError('Failed to create user. The email may already be in use.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background px-4 sm:px-6 lg:px-8">
            <div className="mx-auto">
                <div className="mb-6">
                    <BackLink to="/users">Back to Users</BackLink>
                </div>

                <div className="bg-card shadow rounded-lg p-6">
                    <h1 className="text-xl font-bold text-foreground mb-6">New User</h1>

                    {error && (
                        <div
                            className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-destructive rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Roles
                            </label>
                            <div className="space-y-2">
                                {roleOptions.map((r) => (
                                    <label key={r} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedRoles.includes(r)}
                                            onChange={() => toggleRole(r)}
                                            className="rounded border-border"
                                        />
                                        <span className="text-sm text-foreground">{r}</span>
                                    </label>
                                ))}
                            </div>
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
