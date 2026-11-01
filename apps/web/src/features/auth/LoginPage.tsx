import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginSchema, type LoginDto } from '@smart-dukan/shared';
import { apiClient } from '@/shared/api/client';
import { useAuthStore } from './store/auth.store';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { jwtDecode } from '@/shared/lib/jwt';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginDto>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginDto) => {
    try {
      const res = await apiClient.post<{ accessToken: string; expiresIn: number }>('/auth/login', data);
      const decoded = jwtDecode(res.data.accessToken) as any;
      setAuth({ id: decoded.sub, name: decoded.name, role: decoded.role }, res.data.accessToken);
      toast.success(`Welcome back, ${decoded.name}!`);
      if (decoded.role === 'SHOPKEEPER') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        (err?.message === 'Network Error'
          ? 'Cannot reach API server at http://localhost:4000. Please start the backend API.'
          : 'Login failed. Please check your credentials.');
      toast.error(detail);
    }
  };

  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center p-4 bg-gradient-hero">
      {/* Background glow blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-brand-lg">
            <Store className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold font-display text-gradient-brand">Smart Dukan</h1>
            <p className="text-sm text-white/40 mt-1">Your shop, but it thinks ahead.</p>
          </div>
        </div>

        {/* Form card */}
        <div className="glass rounded-xl3 p-8 shadow-card">
          <h2 className="text-xl font-semibold mb-1">Sign in</h2>
          <p className="text-sm text-white/50 mb-5">Enter your credentials to continue</p>

          {/* Quick Demo Credentials Autofill */}
          <div className="mb-5 p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-purple-200">Demo Shopkeeper</p>
              <p className="text-[11px] text-white/50 font-mono">+919876543210 • Shopkeeper@123</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setValue('identifier', '+919876543210', { shouldValidate: true });
                setValue('password', 'Shopkeeper@123', { shouldValidate: true });
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-sm transition-all shrink-0 active:scale-95"
            >
              Fill Demo
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Input
              label="Phone or Email"
              placeholder="+91XXXXXXXXXX or email@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.identifier?.message}
              {...register('identifier')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <Button type="submit" loading={isSubmitting} size="lg" className="mt-1 w-full">
              Sign in <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white/50">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-300 hover:text-brand-200 font-medium transition-colors">
              Register
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
