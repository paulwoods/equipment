import React, {useState} from "react";
import {setupAdmin} from "../api/client";
import {Lock, Mail} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {Button} from "../components/ui/button";
import {Input} from "../components/ui/input";
import {Label} from "../components/ui/label";
import {Alert, AlertDescription} from "../components/ui/alert";

interface SetupPageProps {
    onSetupComplete: (email: string) => void;
}

const SetupPage = ({onSetupComplete}: SetupPageProps): React.JSX.Element => {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const res = await setupAdmin(email, password);
            if (res.ok) {
                onSetupComplete(email);
                window.location.href = '/dashboard';
            } else if (res.status === 409) {
                setError("Setup already completed. Redirecting to login...");
                setTimeout(() => navigate('/login', {replace: true}), 2000);
                setLoading(false);
            } else {
                setError("Setup failed. Please try again.");
                setLoading(false);
            }
        } catch {
            setError("Setup failed. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{background: 'var(--background)'}}>
            <div
                className="max-w-md w-full space-y-8 p-8 rounded-xl border shadow-lg"
                style={{background: 'var(--card)', borderColor: 'var(--border)'}}
            >
                <div>
                    <h2 className="text-center text-3xl font-extrabold" style={{color: 'var(--card-foreground)'}}>
                        Welcome
                    </h2>
                    <p className="mt-2 text-center text-sm" style={{color: 'var(--muted-foreground)'}}>
                        Create your admin account to get started
                    </p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="sr-only">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--muted-foreground)]"/>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    autoFocus
                                    placeholder="Admin email address"
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="sr-only">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--muted-foreground)]"/>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="Password"
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Creating account..." : "Create admin account"}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export {SetupPage};
