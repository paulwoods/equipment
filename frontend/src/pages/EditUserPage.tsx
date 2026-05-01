import React, {useEffect, useState} from "react";
import axios from "axios";
import {Link, useNavigate, useParams} from "react-router-dom";
import type {User, UserRole} from "../types/user";
import {assignableRoles, isSystemAdmin, roleBadgeClass} from "../types/user";
import {BackLink} from "../components";
import {getUser, updateUser} from "../api/client";
import {useAuth} from "../hooks";
import {Button} from "../components/ui/button";

const EditUserPage = (): React.JSX.Element => {
    const {id} = useParams() as { id: string };
    const navigate = useNavigate();
    const {roles: callerRoles, userId, setAuthenticated} = useAuth();
    const isSelfEdit = userId !== null && userId === id;
    const callerIsSystemAdmin = isSystemAdmin(callerRoles);
    const roleOptions = assignableRoles(callerRoles);

    const [user, setUser] = useState<User | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'roles'>('details');

    useEffect(() => {
        getUser(id)
            .then((data) => {
                setUser(data);
                setName(data.name);
                setEmail(data.email);
                setSelectedRoles(data.roles.map(r => r.name));
            })
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, [id]);

    const toggleRole = (role: UserRole) => {
        if (isSelfEdit && role === 'SYSTEM_ADMIN') {
            return;
        }
        setSelectedRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const rolesToSubmit = isSelfEdit && callerIsSystemAdmin
                ? [...new Set([...selectedRoles, 'SYSTEM_ADMIN'])] as UserRole[]
                : selectedRoles;
            await updateUser(id, {name, email, roles: rolesToSubmit});
            if (isSelfEdit) {
                await setAuthenticated(true);
            }
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
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-background py-8 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-2xl font-bold text-foreground mb-4">User not found</h1>
                    <Link to="/users" className="text-primary hover:underline">
                        Back to Users
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background px-4 sm:px-6 lg:px-8">
            <div className="mx-auto">
                <div className="mb-6">
                    <BackLink to="/users">Back to Users</BackLink>
                </div>

                <div className="bg-card shadow rounded-lg p-6">
                    <h1 className="text-xl font-bold text-foreground mb-6">Edit User</h1>

                    {error && (
                        <div
                            className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-destructive rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div className="border-b border-border mb-6">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button
                                type="button"
                                onClick={() => setActiveTab('details')}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
                                aria-current={activeTab === 'details' ? 'page' : undefined}
                            >
                                Details
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('roles')}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'roles' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
                                aria-current={activeTab === 'roles' ? 'page' : undefined}
                            >
                                Roles
                            </button>
                        </nav>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {activeTab === 'details' && (
                            <div className="space-y-4">
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
                            </div>
                        )}

                        {activeTab === 'roles' && (
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Roles
                                </label>
                                {isSelfEdit && !callerIsSystemAdmin ? (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedRoles.map((r) => (
                                            <span
                                                key={r}
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadgeClass(r)}`}
                                            >
                                                {r}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {roleOptions.map((r) => {
                                            const isOwnSystemAdmin = isSelfEdit && r === 'SYSTEM_ADMIN';
                                            return (
                                                <label
                                                    key={r}
                                                    className={`flex items-center gap-2 ${isOwnSystemAdmin ? '' : 'cursor-pointer'}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedRoles.includes(r)}
                                                        onChange={() => toggleRole(r)}
                                                        disabled={isOwnSystemAdmin}
                                                        className="rounded border-border"
                                                    />
                                                    <span className="text-sm text-foreground">{r}</span>
                                                    {isOwnSystemAdmin && (
                                                        <span className="text-xs text-muted-foreground">
                                                            You cannot remove your own SYSTEM_ADMIN role
                                                        </span>
                                                    )}
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

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
