import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Phone, Mail, Lock, Store, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { registerSchema, type RegisterDto } from '@smart-dukan/shared';
import { apiClient } from '@/shared/api/client';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';

const roleOptions = [
  { value: 'CUSTOMER',    label: '🛒 Customer',    desc: 'Order from local shops' },
  { value: 'SHOPKEEPER',  label: '🏪 Shopkeeper',   desc: 'Manage my shop & inventory' },
  { value: 'RIDER',       label: '🚴 Delivery Rider', desc: 'Deliver orders' },
];

export default function RegisterPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterDto>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'CUSTOMER' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterDto) => {
    try {
      await apiClient.post('/auth/register', data);
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        (err?.message === 'Network Error'
          ? 'Cannot reach API server at http://localhost:4000. Please start the backend API.'
          : 'Registration failed.');
      toast.error(detail);
    }
  };

  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center p-4 bg-gradient-hero">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-brand-lg">
            <Store className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold font-display text-gradient-brand">Create Account</h1>
            <p className="text-sm text-white/40 mt-1">Join Smart Dukan 2.0</p>
          </div>
        </div>

        <div className="glass rounded-xl3 p-8 shadow-card">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {/* Role selector */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white/80">I am a…</label>
              <div className="grid grid-cols-3 gap-2">
                {roleOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValue('role', opt.value as RegisterDto['role'])}
                    className={`rounded-xl border p-3 text-center transition-all duration-200 text-xs ${
                      selectedRole === opt.value
                        ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                        : 'border-surface-border bg-surface-card text-white/50 hover:border-brand-500/50'
                    }`}
                  >
                    <div className="text-lg mb-1">{opt.label.split(' ')[0]}</div>
                    <div className="font-medium">{opt.label.split(' ').slice(1).join(' ')}</div>
                  </button>
                ))}
              </div>
              {errors.role && <p className="text-xs text-red-400">{errors.role.message}</p>}
            </div>

            <Input label="Full Name" placeholder="Ramesh Kumar" leftIcon={<User className="h-4 w-4" />} error={errors.name?.message} {...register('name')} />
            <Input label="Phone Number" placeholder="+91XXXXXXXXXX" leftIcon={<Phone className="h-4 w-4" />} error={errors.phone?.message} {...register('phone')} />
            <Input label="Email (optional)" type="email" placeholder="you@example.com" leftIcon={<Mail className="h-4 w-4" />} error={errors.email?.message} {...register('email')} />
            <Input label="Password (optional)" type="password" placeholder="Min 8 chars, 1 upper, 1 number" leftIcon={<Lock className="h-4 w-4" />} error={errors.password?.message} hint="Leave blank to use OTP login" {...register('password')} />

            <Button type="submit" loading={isSubmitting} size="lg" className="mt-1 w-full">
              Create Account <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white/50">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-300 hover:text-brand-200 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
