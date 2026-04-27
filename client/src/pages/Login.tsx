import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const response = await authAPI.login({
          emailOrPhone: formData.email || formData.phone,
          password: formData.password,
        });
        login(
          { id: response.data.userId, name: '', email: formData.email, phone: formData.phone },
          response.data.token
        );
        toast.success('Logged in successfully!');
        setLocation('/');
      } else {
        const response = await authAPI.register(formData);
        login(
          { id: response.data.userId, name: formData.name, email: formData.email, phone: formData.phone },
          response.data.token
        );
        toast.success('Registered successfully!');
        setLocation('/');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md p-8 border-border">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Resume AI</h1>
          <p className="text-muted-foreground">{isLogin ? 'Welcome back' : 'Get started'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <Input
              type="text"
              name="name"
              placeholder="Full name"
              value={formData.name}
              onChange={handleChange}
              required
              className="bg-card border-border"
            />
          )}

          <Input
            type={isLogin ? 'text' : 'email'}
            name={isLogin ? 'email' : 'email'}
            placeholder={isLogin ? 'Email or phone' : 'Email'}
            value={formData.email}
            onChange={handleChange}
            required
            className="bg-card border-border"
          />

          {!isLogin && (
            <Input
              type="tel"
              name="phone"
              placeholder="Phone number"
              value={formData.phone}
              onChange={handleChange}
              required
              className="bg-card border-border"
            />
          )}

          <Input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="bg-card border-border"
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {loading ? 'Loading...' : isLogin ? 'Login' : 'Register'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-primary hover:underline font-semibold"
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}
