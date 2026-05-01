import React, {useEffect, useState} from "react";
import axios from "axios";
import {changePassword, getUser, updateMe} from "../api/client";
import {useAuth} from "../hooks";
import {Button} from "../components/ui/button";
import {Input} from "../components/ui/input";
import {Alert, AlertDescription} from "../components/ui/alert";
import {LoadingScreen, PageContainer} from "../components";
import {roleBadgeClass} from "../types/user";

type Tab = 'details' | 'roles' | 'password';

const ProfilePage = (): React.JSX.Element => {
    const {userId, setAuthenticated, roles} = useAuth();

    const [activeTab, setActiveTab] = useState<Tab>('details');

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

    const tabs: { key: Tab; label: string }[] = [
        {key: 'details', label: 'Details'},
        {key: 'roles', label: 'Roles'},
        {key: 'password', label: 'Password'},
    ];

    if (profileLoading) {
        return <LoadingScreen/>;
    }

    if (profileError && !name) {
        return (
            <PageContainer className="max-w-2xl pt-8">
                <Alert variant="destructive">
                    <AlertDescription>{profileError}</AlertDescription>
                </Alert>
            </PageContainer>
        );
    }

    return (
        <PageContainer className="space-y-8">
                <h1 className="text-2xl font-bold text-foreground pt-2">My Profile</h1>

                <div className="bg-card shadow rounded-lg">
                    {/* Tab Bar */}
                    <div className="border-b border-border px-6 pt-4">
                        <nav className="flex gap-6" aria-label="Profile tabs">
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`pb-3 text-sm font-medium transition-colors ${
                                            isActive
                                                ? 'text-foreground border-b-2 border-primary'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* Details Tab */}
                        {activeTab === 'details' && (
                            <form onSubmit={handleProfileSubmit} className="space-y-4">
                                {profileError && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{profileError}</AlertDescription>
                                    </Alert>
                                )}
                                {profileSuccess && (
                                    <Alert>
                                        <AlertDescription>{profileSuccess}</AlertDescription>
                                    </Alert>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        Name
                                    </label>
                                    <Input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        Email
                                    </label>
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <Button type="submit" disabled={profileSubmitting}>
                                    {profileSubmitting ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </form>
                        )}

                        {/* Roles Tab */}
                        {activeTab === 'roles' && (
                            <div>
                                <h2 className="text-lg font-semibold text-foreground mb-4">Your Roles</h2>
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
                        )}

                        {/* Password Tab */}
                        {activeTab === 'password' && (
                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                {passwordError && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{passwordError}</AlertDescription>
                                    </Alert>
                                )}
                                {passwordSuccess && (
                                    <Alert>
                                        <AlertDescription>{passwordSuccess}</AlertDescription>
                                    </Alert>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        Current Password
                                    </label>
                                    <Input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        New Password
                                    </label>
                                    <Input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        Confirm New Password
                                    </label>
                                    <Input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <Button type="submit" disabled={passwordSubmitting}>
                                    {passwordSubmitting ? 'Changing...' : 'Change Password'}
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
        </PageContainer>
    );
};

export {ProfilePage};
