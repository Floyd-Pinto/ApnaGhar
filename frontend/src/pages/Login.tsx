import React, { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { authAPI } from '../services/api';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username_or_email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated, user } = useAuth();
  const location = useLocation();

  // If already logged in, redirect to role-specific dashboard
  if (isAuthenticated) {
    const dashboardPath = user?.role === 'builder' ? '/dashboard/builder' : '/dashboard/buyer';
    const from = location.state?.from?.pathname || dashboardPath;
    return <Navigate to={from} replace />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    setIsLoading(true);

    try {
      await login(formData);
      // Navigation will be handled by the Navigate component above
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Parse backend validation errors
      if (err.response && err.response.data) {
        const backendErrors = err.response.data;
        
        // Check if it's a field-specific error object
        if (typeof backendErrors === 'object' && !Array.isArray(backendErrors)) {
          const parsedErrors: Record<string, string[]> = {};
          
          Object.keys(backendErrors).forEach(field => {
            if (Array.isArray(backendErrors[field])) {
              parsedErrors[field] = backendErrors[field];
            } else if (typeof backendErrors[field] === 'string') {
              parsedErrors[field] = [backendErrors[field]];
            }
          });
          
          // Check if we have field-specific errors or a general error message
          if (Object.keys(parsedErrors).length > 0 && !backendErrors.detail) {
            setErrors(parsedErrors);
          } else {
            setGeneralError(backendErrors.detail || backendErrors.message || 'Login failed');
          }
        } else if (typeof backendErrors === 'string') {
          setGeneralError(backendErrors);
        } else {
          setGeneralError('Login failed');
        }
      } else {
        setGeneralError(err.message || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5"></div>
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cta/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      
      <Card className="w-full max-w-lg shadow-elevated border border-border glass-card relative z-10">
        <CardHeader className="space-y-3 pb-6">
          <CardTitle className="text-3xl font-bold text-center text-card-foreground">Welcome Back</CardTitle>
          <CardDescription className="text-center text-muted-foreground text-base">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {generalError && (
              <Alert variant="destructive">
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username_or_email">Username or Email</Label>
              <Input
                id="username_or_email"
                name="username_or_email"
                type="text"
                required
                value={formData.username_or_email}
                onChange={handleChange}
                placeholder="Enter your username or email"
                className={errors.username_or_email ? 'border-red-500' : ''}
              />
              {errors.username_or_email && (
                <p className="text-sm text-red-500">{errors.username_or_email.join(', ')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.join(', ')}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => window.location.href = authAPI.getGoogleAuthUrl()}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </Button>

          <div className="mt-4 text-center text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;