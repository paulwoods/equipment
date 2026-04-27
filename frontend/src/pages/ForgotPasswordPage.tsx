import React, {useState} from 'react';
import {forgotPassword} from '../api/client';
import {Mail} from 'lucide-react';
import {Link} from 'react-router-dom';
import {Button} from '../components/ui/button';
import {Input} from '../components/ui/input';
import {Label} from '../components/ui/label';
import {Alert, AlertDescription} from '../components/ui/alert';

const ForgotPasswordPage = (): React.JSX.Element => {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        const formData = new FormData(event.currentTarget);
        const email = formData.get('email') as string;

        try {
            const res = await forgotPassword(email);
            if (res.ok) {
                setSuccess(true);
            } else if (res.status === 429) {
                setError('Too many requests. Please try again later.');
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
            <div className="max-w-md w-full space-y-8 p-8 rounded-xl border shadow-lg bg-card border-border">
                <div>
                    <h2 className="text-center text-3xl font-extrabold text-card-foreground">
                        Reset your password
                    </h2>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                        Enter your email and we will send you reset instructions
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert>
                            <AlertDescription>
                                If your email is registered, you will receive reset instructions shortly.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="email" className="sr-only">Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                required
                                placeholder="Email"
                                className="pl-10"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Sending...' : 'Send reset instructions'}
                    </Button>

                    <p className="text-center text-sm">
                        <Link to="/login" className="text-primary hover:underline">
                            Back to login
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export {ForgotPasswordPage};
