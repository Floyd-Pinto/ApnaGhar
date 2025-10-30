import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    role: 'buyer' as 'buyer' | 'builder',
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
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

    // Validate passwords match
    if (formData.password !== formData.password2) {
      setErrors({ password2: ['Passwords do not match'] });
      return;
    }

    if (formData.password.length < 8) {
      setErrors({ password: ['Password must be at least 8 characters long'] });
      return;
    }

    setIsLoading(true);
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      
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
          if (Object.keys(parsedErrors).length > 0) {
            setErrors(parsedErrors);
          } else {
            setGeneralError(backendErrors.detail || backendErrors.message || 'Registration failed');
          }
        } else if (typeof backendErrors === 'string') {
          setGeneralError(backendErrors);
        } else {
          setGeneralError('Registration failed');
        }
      } else {
        setGeneralError(err.message || 'Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl shadow-elevated border border-border bg-card">
        <CardHeader className="space-y-3 pb-6">
          <CardTitle className="text-3xl font-bold text-center text-card-foreground">Create Account</CardTitle>
          <CardDescription className="text-center text-muted-foreground text-base">
            Enter your information to create your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {generalError && (
              <Alert variant="destructive">
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="John"
                  className={errors.first_name ? 'border-red-500' : ''}
                />
                {errors.first_name && (
                  <p className="text-sm text-red-500">{errors.first_name.join(', ')}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Doe"
                  className={errors.last_name ? 'border-red-500' : ''}
                />
                {errors.last_name && (
                  <p className="text-sm text-red-500">{errors.last_name.join(', ')}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="johndoe"
                className={errors.username ? 'border-red-500' : ''}
              />
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username.join(', ')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.join(', ')}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label>I am a</Label>
              <RadioGroup
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as 'buyer' | 'builder' })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2 border rounded-lg p-4 flex-1 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="buyer" id="buyer" />
                  <Label htmlFor="buyer" className="cursor-pointer flex-1">
                    <div className="font-semibold">Buyer</div>
                    <div className="text-sm text-muted-foreground">Looking to buy property</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-4 flex-1 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="builder" id="builder" />
                  <Label htmlFor="builder" className="cursor-pointer flex-1">
                    <div className="font-semibold">Builder</div>
                    <div className="text-sm text-muted-foreground">Selling or listing property</div>
                  </Label>
                </div>
              </RadioGroup>
              {errors.role && (
                <p className="text-sm text-red-500">{errors.role.join(', ')}</p>
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

            <div className="space-y-2">
              <Label htmlFor="password2">Confirm Password</Label>
              <Input
                id="password2"
                name="password2"
                type="password"
                required
                value={formData.password2}
                onChange={handleChange}
                placeholder="Confirm your password"
                className={errors.password2 ? 'border-red-500' : ''}
              />
              {errors.password2 && (
                <p className="text-sm text-red-500">{errors.password2.join(', ')}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;