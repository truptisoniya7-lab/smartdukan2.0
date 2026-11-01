import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { PageLoader } from '@/shared/ui/PageLoader';

// Lazy-loaded routes
const LandingPage    = lazy(() => import('@/features/landing/LandingPage'));
const LoginPage      = lazy(() => import('@/features/auth/LoginPage'));
const RegisterPage   = lazy(() => import('@/features/auth/RegisterPage'));
const DashboardPage  = lazy(() => import('@/features/shop-dashboard/DashboardPage'));
const InventoryPage  = lazy(() => import('@/features/shop-dashboard/InventoryPage'));
const ProductsPage   = lazy(() => import('@/features/shop-dashboard/ProductsPage'));
const OrderQueuePage = lazy(() => import('@/features/shop-dashboard/OrderQueuePage'));

function PrivateRoute({ children }: { children: React.ReactNode; role?: string }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={
          <PrivateRoute><DashboardPage /></PrivateRoute>
        } />
        <Route path="/dashboard/inventory" element={
          <PrivateRoute><InventoryPage /></PrivateRoute>
        } />
        <Route path="/dashboard/products" element={
          <PrivateRoute><ProductsPage /></PrivateRoute>
        } />
        <Route path="/dashboard/orders" element={
          <PrivateRoute><OrderQueuePage /></PrivateRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
