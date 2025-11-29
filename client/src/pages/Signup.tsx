import { useState } from 'react';
import { Link } from 'wouter';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, Mail } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validatePassword = (pass: string): string | null => {
    if (pass.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(pass)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pass)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pass)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-green-500/10 p-4">
                <Mail className="h-12 w-12 text-green-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4">Check your email</h2>
            <p className="text-lg text-muted-foreground mb-6">
              to activate your Hubisck account
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              We sent a confirmation link to <strong className="text-foreground">{email}</strong>
            </p>
            <Link href="/login">
              <Button variant="outline" className="w-full" data-testid="button-back-to-login">
                Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <span className="text-4xl font-bold text-[#FF6600]">Hubisck</span>
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            Sign up for your Hubisck account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 8 chars, uppercase, lowercase, number"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                data-testid="input-confirm-password"
              />
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p className={password.length >= 8 ? 'text-green-500' : ''}>
                {password.length >= 8 ? <CheckCircle2 className="inline h-3 w-3 mr-1" /> : '•'} At least 8 characters
              </p>
              <p className={/[A-Z]/.test(password) ? 'text-green-500' : ''}>
                {/[A-Z]/.test(password) ? <CheckCircle2 className="inline h-3 w-3 mr-1" /> : '•'} One uppercase letter
              </p>
              <p className={/[a-z]/.test(password) ? 'text-green-500' : ''}>
                {/[a-z]/.test(password) ? <CheckCircle2 className="inline h-3 w-3 mr-1" /> : '•'} One lowercase letter
              </p>
              <p className={/[0-9]/.test(password) ? 'text-green-500' : ''}>
                {/[0-9]/.test(password) ? <CheckCircle2 className="inline h-3 w-3 mr-1" /> : '•'} One number
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#FF6600] hover:bg-[#FF6600]/90"
              disabled={loading}
              data-testid="button-signup"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-[#FF6600] hover:underline" data-testid="link-login">
              Log In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
