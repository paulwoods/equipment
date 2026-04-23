import React, {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import type {User} from "../types/user";
import {canManageUsers} from "../types/user";
import {deleteUser, fetchUsers} from "../api/client";
import {useAuth} from "../hooks";

const UsersPage = (): React.JSX.Element => {
    const {role} = useAuth();
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

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-600 dark:text-red-400">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Users</h1>
                    {isAdmin && (
                        <Link
                            to="/users/new"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-center"
                        >
                            New User
                        </Link>
                    )}
                </div>

                <div className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden">
                    {users.length === 0 ? (
                        <p className="p-6 text-center text-gray-500 dark:text-gray-400">No users found.</p>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Role
                                </th>
                                {isAdmin && (
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                )}
                            </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {user.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                        {user.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
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
                                    </td>
                                    {isAdmin && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <Link
                                                to={`/users/${user.id}/edit`}
                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export {UsersPage};
