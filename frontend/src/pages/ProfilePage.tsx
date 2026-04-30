import React, {useEffect, useState} from "react";
import axios from "axios";
import {changePassword, getUser, updateMe} from "../api/client";
import {useAuth} from "../hooks";
import {Button} from "../components/ui/button";
import {Alert, AlertDescription} from "../components/ui/alert";
import type {UserRole} from "../types/user";

const roleBadgeClass = (role: UserRole): string => {
    switch (role) {
        case 'SYSTEM_ADMIN':
            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        case 'ADMIN':
            return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
        case 'EDIT':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
};

const ProfilePage = (): React.JSX.Element => {
    const {userId, setAuthenticated, roles} = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
    const [profileSubmitting, setProfileSubmitting] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
    const [passwordSubmitting, setPasswordSubmitting] = useState(false);

    useEffect(() => {
        if (!userId) return;
        getUser(userId)
            .then((data) => {
                setName(data.name);
                setEmail(data.email);
            })
            .catch(() => setProfileError("Failed to load your profile."))
            .finally(() => setProfileLoading(false));
    }, [userId]);

    const handleProfileSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setProfileError(null);
        setProfileSuccess(null);
        setProfileSubmitting(true);
        try {
            await updateMe({name, email});
            setProfileSuccess("Profile updated successfully.");
            await setAuthenticated(true);
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.data?.detail) {
                setProfileError(err.response.data.detail);
            } else {
                setProfileError("Failed to update profile. The email may already be in use.");
            }
        } finally {
            setProfileSubmitting(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);

        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match.");
            return;
        }

        setPasswordSubmitting(true);
        try {
            await changePassword({currentPassword, newPassword});
            setPasswordSuccess("Password changed successfully.");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.data?.detail) {
                setPasswordError(err.response.data.detail);
            } else {
                setPasswordError("Failed to change password. Please check your current password.");
            }
        } finally {
            setPasswordSubmitting(false);
        }
    };

    if (profileLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (profileError && !name) {
        return (
            <div className="min-h-screen bg-background px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl pt-8">
                    <Alert variant="destructive">
                        <AlertDescription>{profileError}</AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background px-4 sm:px-6 lg:px-8">
            <div className="mx-auto space-y-8">
                <h1 className="text-2xl font-bold text-foreground pt-2">My Profile</h1>

                {/* Profile Details */}
                <div className="bg-card shadow rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Profile Details</h2>

                    {profileError && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{profileError}</AlertDescription>
                        </Alert>
                    )}
                    {profileSuccess && (
                        <Alert className="mb-4">
                            <AlertDescription>{profileSuccess}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleProfileSubmit} className="space-y-4">
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
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Roles
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {roles.map((r) => (
                                    <span
                                        key={r}
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadgeClass(r)}`}
                                    >
                                        {r}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <Button type="submit" disabled={profileSubmitting}>
                            {profileSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </form>
                </div>

                {/* Change Password */}
                <div className="bg-card shadow rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Change Password</h2>

                    {passwordError && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{passwordError}</AlertDescription>
                        </Alert>
                    )}
                    {passwordSuccess && (
                        <Alert className="mb-4">
                            <AlertDescription>{passwordSuccess}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <Button type="submit" disabled={passwordSubmitting}>
                            {passwordSubmitting ? 'Changing...' : 'Change Password'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export {ProfilePage};
