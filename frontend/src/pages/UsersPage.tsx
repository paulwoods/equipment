import React, {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import type {User} from "../types/user";
import {canManageUsers} from "../types/user";
import {deleteUser, fetchUsers} from "../api/client";
import {useAuth} from "../hooks";
import {Button} from "../components/ui/button";
import {Alert, AlertDescription} from "../components/ui/alert";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "../components/ui/table";
import {TableSkeleton} from "../components";

const UsersPage = (): React.JSX.Element => {
    const {role, userId} = useAuth();
    const isAdmin = canManageUsers(role);

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers()
            .then(setUsers)
            .catch(() => setError("Failed to load users."))
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id: string): Promise<void> => {
        if (!confirm("Are you sure you want to delete this user?")) return;
        try {
            await deleteUser(id);
            setUsers(users.filter((u) => u.id !== id));
        } catch {
            alert("Failed to delete user.");
        }
    };

    if (loading) return <TableSkeleton rows={5} columns={4}/>;
    if (error) return (
        <div className="p-8">
            <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
        </div>
    );

    return (
        <div className="min-h-screen bg-background px-4 sm:px-6 lg:px-8">
            <div className="mx-auto">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                    <h1 className="text-2xl font-bold text-foreground">Users</h1>
                    {isAdmin && (
                        <Button asChild>
                            <Link to="/users/new">New User</Link>
                        </Button>
                    )}
                </div>

                <div className="bg-card shadow rounded-lg overflow-hidden">
                    {users.length === 0 ? (
                        <p className="p-6 text-center text-muted-foreground">No users found.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium text-foreground">
                                            {user.name}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {user.email}
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    user.role === 'SYSTEM_ADMIN'
                                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                        : user.role === 'ADMIN'
                                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                            : user.role === 'EDIT'
                                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </TableCell>
                                        {isAdmin && (
                                            <TableCell className="text-right">
                                                <Link
                                                    to={`/users/${user.id}/edit`}
                                                    className="text-primary hover:opacity-80 mr-4"
                                                >
                                                    Edit
                                                </Link>
                                                {user.id !== userId && (
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="text-destructive hover:opacity-80"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>
        </div>
    );
};

export {UsersPage};
