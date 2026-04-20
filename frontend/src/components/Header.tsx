import React from "react";
import {Link} from "react-router-dom";
import {ThemeToggle} from "./ThemeToggle";
import {logout} from "../api/client";
import {LogOut} from "lucide-react";
import {useAuth} from "../hooks";

export const Header = (): React.JSX.Element => {
    const {username, setAuthenticated} = useAuth();

    const handleLogout = async (): Promise<void> => {
        await logout();
        setAuthenticated(false);
        window.location.href = '/';
    };

    return (
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">Equipment Manager</span>
                </Link>
                <div className="flex items-center gap-4">
                    <ThemeToggle/>
                    {username && (
                        <div className="flex items-center gap-4 border-l border-gray-200 dark:border-gray-800 pl-4">
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <span className="font-medium">{username}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                                >
                                    <LogOut className="w-4 h-4"/>
                                    <span className="hidden sm:inline">Logout</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
