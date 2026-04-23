import React, {useState} from 'react';
import {login} from '../api/client';
import {Lock, User} from 'lucide-react';
import {useAuth} from '../hooks';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {Button} from '../components/ui/button';
import {Input} from '../components/ui/input';
import {Label} from '../components/ui/label';
import {Alert, AlertDescription} from '../components/ui/alert';

const LoginPage = (): React.JSX.Element => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {setAuthenticated} = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const res = await login(email, password);
      if (res.ok) {
        await setAuthenticated(true);
        const returnTo = searchParams.get('returnTo');
        navigate(returnTo ? decodeURIComponent(returnTo) : '/', {replace: true});
      } else {
        setError('Invalid username or password');
        setLoading(false);
      }
    } catch {
      setError('Login failed. Please try again.');
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
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm" style={{color: 'var(--muted-foreground)'}}>
            Please enter your email and password
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
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--muted-foreground)]"/>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="Email"
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
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export {LoginPage};
