import React, {useState} from 'react';
import {resetPassword} from '../api/client';
import {Lock} from 'lucide-react';
import {Link, useSearchParams} from 'react-router-dom';
import {Button} from '../components/ui/button';
import {Input} from '../components/ui/input';
import {Label} from '../components/ui/label';
import {Alert, AlertDescription} from '../components/ui/alert';
import {AuthCard} from '../components';

const ResetPasswordPage = (): React.JSX.Element => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') ?? '';

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        const formData = new FormData(event.currentTarget);
        const newPassword = formData.get('newPassword') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }

        try {
            const res = await resetPassword(token, newPassword);
            if (res.ok) {
                setSuccess(true);
            } else if (res.status === 400) {
                setError('Invalid or expired token.');
            } else {
                setError('Request failed. Please try again.');
            }
        } catch {
            setError('Request failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-background">
            <AuthCard title="Set new password" subtitle="Enter your new password below">
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert>
                            <AlertDescription>
                                Your password has been updated.{' '}
                                <Link to="/login" className="text-primary hover:underline">
                                    Sign in
                                </Link>
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="newPassword" className="sr-only">New password</Label>
                            <div className="relative">
                                <Lock
                                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                                <Input
                                    id="newPassword"
                                    name="newPassword"
                                    type="password"
                                    required
                                    minLength={8}
                                    placeholder="New password"
                                    className="pl-10"
                                    disabled={loading || success}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="confirmPassword" className="sr-only">Confirm password</Label>
                            <div className="relative">
                                <Lock
                                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    minLength={8}
                                    placeholder="Confirm password"
                                    className="pl-10"
                                    disabled={loading || success}
                                />
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading || success}>
                        {loading ? 'Updating...' : 'Update password'}
                    </Button>
                </form>
            </AuthCard>
        </div>
    );
};

export {ResetPasswordPage};
