import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { useAuthStore } from '@/features/auth/store/auth.store';
import toast from 'react-hot-toast';
import {
  Brain,
  Package,
  Truck,
  BarChart3,
  ArrowRight,
  Sparkles,
  Store,
  Users,
  Bike,
  MessageCircle,
  X,
  Send,
  Zap,
  Layers,
  ShoppingCart,
  Check,
  Tag,
  LogOut,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

const features = [
  {
    icon: Brain,
    color: 'purple',
    title: 'AI Demand Forecasting',
    desc: "Knows what you'll need before you run out. 7/14/30-day SKU forecasts trained on seasonal local buying patterns.",
  },
  {
    icon: Package,
    color: 'amber',
    title: 'Smart Inventory',
    desc: 'Real-time stock monitoring, automated expiry alerts, and smart restock recommendations in one tap.',
  },
  {
    icon: Truck,
    color: 'emerald',
    title: 'Instant Delivery Match',
    desc: 'Local riders matched in < 30 seconds with automated batching and real-time live map tracking.',
  },
  {
    icon: BarChart3,
    color: 'blue',
    title: 'Profit & Sales Intelligence',
    desc: 'Margin heatmaps, fast-moving items, and shrinkage alerts tailored specifically for neighbourhood shops.',
  },
];

const stats = [
  { value: '< 5%', label: 'Stock-Out rate on top SKUs' },
  { value: '90%+', label: 'On-time delivery target' },
  { value: '≤ 20%', label: 'Forecast error (MAPE)' },
  { value: '< 30s', label: 'Rider assignment (p95)' },
];

export default function LandingPage() {
  const [showWidget, setShowWidget] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/categories').then((r) => r.data as any[]),
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => apiClient.get('/shop/inventory').then((r) => r.data as any[]),
    enabled: Boolean(isAuthenticated && user?.role === 'SHOPKEEPER'),
  });

  const handleLogout = () => {
    clearAuth();
    toast.success('Signed out successfully');
  };

  const allLiveProducts = (inventory && inventory.length > 0)
    ? inventory.map((item: any) => ({
        id: item.product?.id || item.id,
        name: item.product?.name,
        sku: item.product?.sku,
        unit: item.product?.unit,
        sellPrice: item.product?.sellPrice,
        mrp: item.product?.mrp,
        availableQty: item.availableQty ?? 0,
        categorySlug: item.product?.category?.slug || categories.find((c: any) => c.id === item.product?.categoryId)?.slug,
        categoryName: item.product?.category?.name || categories.find((c: any) => c.id === item.product?.categoryId)?.name || 'General',
        categoryIcon: categories.find((c: any) => c.id === item.product?.categoryId)?.iconUrl || '📦',
      }))
    : [
        { id: '1', name: 'Aashirvaad Atta 5kg', sku: 'ATTA-5KG', unit: '5kg', sellPrice: 249, mrp: 265, availableQty: 24, categorySlug: 'grocery', categoryName: 'Grocery', categoryIcon: '🛒' },
        { id: '2', name: 'Amul Full Cream Milk 1L', sku: 'MILK-1L', unit: '1L', sellPrice: 68, mrp: 68, availableQty: 40, categorySlug: 'dairy', categoryName: 'Dairy', categoryIcon: '🥛' },
        { id: '3', name: 'Coca-Cola 600ml', sku: 'COKE-600ML', unit: '600ml', sellPrice: 38, mrp: 40, availableQty: 48, categorySlug: 'beverages', categoryName: 'Beverages', categoryIcon: '🥤' },
        { id: '4', name: "Lay's Masala 26g", sku: 'LAYS-MASALA', unit: '26g', sellPrice: 20, mrp: 20, availableQty: 60, categorySlug: 'snacks', categoryName: 'Snacks', categoryIcon: '🍿' },
        { id: '5', name: 'Toor Dal 1kg', sku: 'TOOR-DAL-1', unit: '1kg', sellPrice: 128, mrp: 135, availableQty: 18, categorySlug: 'grocery', categoryName: 'Grocery', categoryIcon: '🛒' },
        { id: '6', name: 'Amul Toned Milk 500ml', sku: 'MILK-500ML', unit: '500ml', sellPrice: 34, mrp: 34, availableQty: 5, categorySlug: 'dairy', categoryName: 'Dairy', categoryIcon: '🥛' },
        { id: '7', name: 'Sunflower Oil 1L', sku: 'OIL-SUNF-1L', unit: '1L', sellPrice: 138, mrp: 145, availableQty: 0, categorySlug: 'grocery', categoryName: 'Grocery', categoryIcon: '🛒' },
      ];

  const displayProducts = selectedCategory === 'all'
    ? allLiveProducts
    : allLiveProducts.filter((p: any) => p.categorySlug === selectedCategory);

  return (
    <div className="min-h-screen bg-[#060814] text-white selection:bg-purple-600 selection:text-white font-sans relative overflow-x-hidden">
      {/* ── Top Floating Navigation ─────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 sm:px-12 py-5 bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-[2px] transition-all">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-xl bg-[#6332f6] flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform duration-200">
            <Store className="h-5 w-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-white">
            Smart Dukan
          </span>
          <span className="text-[11px] font-medium text-purple-200/70 bg-white/[0.08] border border-white/15 rounded-md px-2 py-0.5 tracking-wider">
            2.0
          </span>
        </Link>

        {/* Auth Nav Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-xs sm:text-sm font-medium text-white/80 hidden sm:inline">
                Hi, <span className="text-purple-300 font-semibold">{user?.name?.split(' ')[0] ?? 'Friend'}</span>
              </span>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 bg-[#6533f8] hover:bg-[#5527db] text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-full shadow-[0_4px_16px_rgba(99,50,246,0.4)] hover:shadow-[0_6px_22px_rgba(99,50,246,0.6)] hover:scale-[1.02] active:scale-95 transition-all duration-200"
              >
                Dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs text-white/50 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-white/80 hover:text-white transition-colors duration-200"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center bg-[#6533f8] hover:bg-[#5527db] text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-[0_4px_16px_rgba(99,50,246,0.4)] hover:shadow-[0_6px_22px_rgba(99,50,246,0.6)] hover:scale-[1.02] active:scale-95 transition-all duration-200"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* ── Hero Section with Exact Illustrated Visual ─────────── */}
      <section className="relative min-h-[92vh] flex flex-col justify-between pt-32 pb-12 px-6 sm:px-10 overflow-hidden">
        {/* Background Artwork Layer (Clean background without any bottom-right circle artifact) */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{
            backgroundImage: "url('/hero-bg-clean.jpg')",
          }}
        />

        {/* Ambient Dark Gradient Overlays for Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060814]/75 via-[#060814]/30 to-[#060814] pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 65% 55% at 50% 45%, rgba(6, 8, 20, 0.75) 0%, rgba(6, 8, 20, 0.4) 55%, transparent 100%)',
          }}
        />
        {/* Dark corner vignette in bottom-right to cleanly eliminate any background artifact */}
        <div className="absolute bottom-0 right-0 w-72 h-48 bg-gradient-to-tl from-[#060814] via-[#060814]/95 to-transparent pointer-events-none z-10" />

        {/* ── Neon Sign on Storefront (Matching reference image) ── */}
        <div className="hidden xl:block absolute left-[9.2%] top-[35.8%] pointer-events-none z-10 select-none">
          <div className="border-[2.5px] border-[#ff9d42] bg-[#1a0a03]/90 rounded-md px-3 py-1 -rotate-1 shadow-[0_0_22px_rgba(255,140,0,0.65)]">
            <span className="font-display font-black text-[13px] tracking-widest text-[#ffe0b3] drop-shadow-[0_0_8px_#ff8c00]">
              LOCAL SHOP
            </span>
          </div>
        </div>

        {/* ── Sidewalk Chalkboard (Matching reference image) ────── */}
        <div className="hidden xl:block absolute left-[6.5%] bottom-[16%] pointer-events-none z-10 select-none">
          <div className="bg-[#11131b]/95 border-2 border-[#2b3040] rounded-sm px-2 py-2.5 shadow-xl text-center leading-tight">
            <div className="text-[9px] font-bold text-amber-200/80 tracking-wider">FRESH</div>
            <div className="text-[9px] font-bold text-amber-200/80 tracking-wider">STOCK</div>
            <div className="text-[9px] font-bold text-amber-300 tracking-wider">DAILY</div>
          </div>
        </div>

        {/* ── Floating AI Network Graph (Shop ↔ Rider ↔ Customer) ── */}
        <div className="hidden xl:block absolute top-24 right-4 2xl:right-20 z-20 pointer-events-none w-[260px] h-[200px]">
          {/* Animated Connecting SVG Lines */}
          <svg className="absolute inset-0 w-full h-full overflow-visible">
            <defs>
              <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="lineGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="lineGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.85" />
              </linearGradient>
            </defs>

            {/* Path: Users (x: 25, y: 120) -> Store (x: 135, y: 25) */}
            <path
              d="M 25 120 Q 75 55 135 25"
              fill="none"
              stroke="url(#lineGrad1)"
              strokeWidth="2"
              strokeDasharray="4 4"
              className="animate-pulse"
            />

            {/* Path: Store (x: 135, y: 25) -> Rider (x: 220, y: 85) */}
            <path
              d="M 135 25 Q 185 45 220 85"
              fill="none"
              stroke="url(#lineGrad2)"
              strokeWidth="2"
              strokeDasharray="4 4"
              className="animate-pulse"
            />

            {/* Path: Rider (x: 220, y: 85) -> Users (x: 25, y: 120) */}
            <path
              d="M 220 85 Q 120 155 25 120"
              fill="none"
              stroke="url(#lineGrad3)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          </svg>

          {/* Node 1: Store (Top) */}
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-0 left-28 flex items-center justify-center"
          >
            <div className="relative">
              <div className="absolute -inset-2 rounded-full bg-purple-500/30 blur-md animate-pulse" />
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-700 border-2 border-purple-300/80 flex items-center justify-center p-2.5 shadow-[0_0_25px_rgba(168,85,247,0.85)]">
                <Store className="w-5 h-5 text-white drop-shadow" />
              </div>
            </div>
          </motion.div>

          {/* Node 2: Customers (Left) */}
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute top-22 left-0 flex items-center justify-center"
          >
            <div className="relative">
              <div className="absolute -inset-2 rounded-full bg-blue-500/30 blur-md animate-pulse" />
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-blue-300/80 flex items-center justify-center p-2 shadow-[0_0_25px_rgba(59,130,246,0.85)]">
                <Users className="w-4 h-4 text-white drop-shadow" />
              </div>
            </div>
          </motion.div>

          {/* Node 3: Rider (Right) */}
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute top-14 right-2 flex items-center justify-center"
          >
            <div className="relative">
              <div className="absolute -inset-2 rounded-full bg-emerald-500/30 blur-md animate-pulse" />
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 border-2 border-emerald-200/80 flex items-center justify-center p-2 shadow-[0_0_25px_rgba(16,185,129,0.85)]">
                <Bike className="w-4 h-4 text-white drop-shadow" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Center Content Hero Block ──────────────────────────── */}
        <div className="relative z-10 max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto flex flex-col items-center text-center mt-2">
          {/* AI Pill Badge */}
          <motion.div
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeUp}
            className="mb-5"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-[#160d33]/90 backdrop-blur-md px-4 py-1.5 text-xs sm:text-sm font-medium text-purple-200 shadow-[0_0_25px_rgba(139,92,246,0.35)]">
              <Sparkles className="h-3.5 w-3.5 text-purple-400 fill-purple-400/20" />
              AI-powered neighbourhood retail — v2.0
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeUp}
            className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl xl:text-[68px] tracking-tight leading-[1.12] text-white"
          >
            Your shop ,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b191ff] via-[#9e7bff] to-[#8d69ff] drop-shadow-[0_0_40px_rgba(160,120,255,0.5)]">
              but it thinks
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9e7bff] via-[#8d69ff] to-[#7b57fa] drop-shadow-[0_0_40px_rgba(160,120,255,0.5)]">
              ahead.
            </span>
          </motion.h1>

          {/* Subtitle Description */}
          <motion.p
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeUp}
            className="text-base sm:text-[17px] text-white/75 max-w-2xl mt-5 leading-relaxed font-normal drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
          >
            Smart Dukan connects customers, shopkeepers, and riders with an AI layer
            that forecasts demand, prevents stock-outs, and assigns the best rider in under 30 seconds.
          </motion.p>

          {/* Call-to-Action Buttons */}
          <motion.div
            initial="hidden"
            animate="visible"
            custom={3}
            variants={fadeUp}
            className="flex flex-wrap items-center justify-center gap-4 mt-8"
          >
            <Link
              to="/register?role=SHOPKEEPER"
              className="inline-flex items-center justify-center gap-2.5 bg-[#6d2df7] hover:bg-[#5b1fe3] text-white font-semibold text-sm sm:text-base px-7 py-3.5 rounded-full shadow-[0_6px_25px_rgba(109,45,247,0.55)] hover:shadow-[0_8px_32px_rgba(109,45,247,0.8)] hover:scale-[1.03] active:scale-95 transition-all duration-200"
            >
              Start as Shopkeeper <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/register?role=CUSTOMER"
              className="inline-flex items-center justify-center bg-[#0d0f1b]/80 hover:bg-[#161a2e]/90 text-white font-semibold text-sm sm:text-base px-7 py-3.5 rounded-full border border-white/15 hover:border-white/30 backdrop-blur-md hover:scale-[1.03] active:scale-95 transition-all duration-200"
            >
              Order from nearby shops
            </Link>
          </motion.div>
        </div>

        {/* ── Bottom Stats Bar ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="relative z-10 w-full max-w-5xl mx-auto mt-14"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/15 border-t border-b border-white/15 py-6 backdrop-blur-sm bg-black/20 rounded-xl px-4">
            {stats.map((s) => (
              <div key={s.label} className="px-4 py-3 md:py-1 text-center">
                <div className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">
                  {s.value}
                </div>
                <div className="text-xs text-white/60 font-medium mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Live Store & Categories Showcase ──────────────────── */}
      <section id="categories" className="py-20 px-6 sm:px-12 relative z-10 border-t border-white/10 bg-gradient-to-b from-[#060814] via-[#090c21] to-[#060814]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-semibold mb-3">
                <Layers className="h-3.5 w-3.5" /> LIVE STOREFRONT & CATEGORIES
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold font-display tracking-tight text-white">
                Explore What's In Stock Right Now
              </h2>
              <p className="text-white/50 text-sm sm:text-base mt-1">
                Live catalogue synced with neighbourhood retail database.
              </p>
            </div>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-purple-200 hover:text-white bg-purple-600/20 hover:bg-purple-600/35 border border-purple-500/30 px-4 py-2.5 rounded-xl transition-all self-start md:self-auto shadow-[0_0_15px_rgba(147,51,234,0.2)]"
            >
              <Store className="h-4 w-4" /> Open Shopkeeper Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-4 scrollbar-none mb-8">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                selectedCategory === 'all'
                  ? 'bg-[#6332f6] text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                  : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/5'
              }`}
            >
              <span>✨</span> All Items ({allLiveProducts.length})
            </button>
            {categories.map((cat: any) => {
              const count = allLiveProducts.filter((p: any) => p.categorySlug === cat.slug).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                    selectedCategory === cat.slug
                      ? 'bg-[#6332f6] text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                      : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/5'
                  }`}
                >
                  <span>{cat.iconUrl || '📦'}</span> {cat.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Product Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayProducts.map((p: any) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-purple-500/40 backdrop-blur-md transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-2xl p-2 rounded-xl bg-white/[0.05] border border-white/10">
                      {p.categoryIcon || '📦'}
                    </span>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                      p.availableQty > 10
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : p.availableQty > 0
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {p.availableQty > 0 ? `${p.availableQty} in stock` : 'Out of stock'}
                    </span>
                  </div>

                  <p className="text-[11px] text-purple-300 font-medium mb-0.5">{p.categoryName}</p>
                  <h3 className="text-base font-bold text-white group-hover:text-purple-200 transition-colors">{p.name}</h3>
                  <p className="text-xs text-white/40 mt-1">SKU: {p.sku} • Unit: {p.unit}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-white">₹{p.sellPrice}</span>
                    {p.mrp > p.sellPrice && (
                      <span className="text-xs text-white/40 line-through ml-2">₹{p.mrp}</span>
                    )}
                  </div>

                  <Link
                    to="/dashboard/inventory"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-[#6332f6] px-3 py-1.5 rounded-lg transition-all"
                  >
                    Manage <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Highlights (Beneath Fold) ───────────────────── */}
      <section className="py-24 px-6 sm:px-12 relative z-10 border-t border-surface-border/50 bg-[#060814]/90">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-white mb-3">
              The decision layer your shop never had
            </h2>
            <p className="text-white/50 text-base sm:text-lg max-w-xl mx-auto">
              Not just a digital register — an intelligent engine driving inventory, pricing, and rapid local deliveries.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl p-6 bg-white/[0.03] border border-white/10 hover:border-purple-500/40 backdrop-blur-md transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mb-4 text-purple-300">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3-Actor Operational Loop ───────────────────────────── */}
      <section className="py-20 px-6 sm:px-12 bg-black/40 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold font-display text-white mb-12">
            One loop, three actors, zero guesswork
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '🛒',
                role: 'Customer',
                desc: 'Orders fresh essentials in under 60 seconds. Real-time stock visibility and accurate delivery ETA.',
              },
              {
                icon: '🏪',
                role: 'Shopkeeper',
                desc: 'AI recommends what to buy before shelf empties. Instant order packing alerts and sales forecasting.',
              },
              {
                icon: '🚴',
                role: 'Rider',
                desc: 'Automated 30-second rider matching with batch delivery paths and secure instant OTP handoffs.',
              },
            ].map((actor, idx) => (
              <div
                key={actor.role}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-purple-500/30 transition-all text-center"
              >
                <div className="text-4xl mb-3">{actor.icon}</div>
                <h4 className="text-lg font-bold text-white mb-2">{actor.role}</h4>
                <p className="text-sm text-white/50 leading-relaxed">{actor.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom Call to Action ──────────────────────────────── */}
      <section className="py-20 px-6 text-center border-t border-white/5 bg-gradient-to-b from-[#060814] to-[#0d0a21]">
        <div className="max-w-xl mx-auto flex flex-col items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-[#6332f6] flex items-center justify-center shadow-lg shadow-purple-600/50">
            <Store className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold font-display text-white">
            Ready to transform your dukan?
          </h2>
          <p className="text-white/60 text-sm sm:text-base">
            Join hundreds of local shops modernizing their retail and neighbourhood delivery with Smart Dukan.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-[#6533f8] hover:bg-[#5527db] text-white font-semibold px-8 py-3.5 rounded-full shadow-lg shadow-purple-600/40 hover:scale-105 transition-all mt-2"
          >
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-8 px-6 text-center text-xs text-white/40">
        © {new Date().getFullYear()} Smart Dukan 2.0 — AI-powered retail for neighbourhood shops.
      </footer>

      {/* ── Floating Helper / Avatar Widget (Bottom Right) ─────── */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowWidget(!showWidget)}
          className="relative group flex items-center justify-center w-13 h-13 rounded-full p-[2px] bg-gradient-to-tr from-emerald-400 via-teal-300 to-amber-300 shadow-[0_0_20px_rgba(20,184,166,0.6)] hover:scale-105 active:scale-95 transition-transform"
          aria-label="Toggle Quick Assistant"
        >
          <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-[#0d1322] border border-white/20">
            <span className="text-xl select-none leading-none">🏝️</span>
          </div>
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#060814]" />
          </span>
        </button>

        {/* Quick Popover Menu */}
        {showWidget && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute bottom-16 right-0 w-72 rounded-2xl bg-[#0e101f] border border-purple-500/30 p-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-semibold text-white">Smart Dukan Assistant</span>
              </div>
              <button
                onClick={() => setShowWidget(false)}
                className="text-white/40 hover:text-white text-xs"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-xs text-white/70 mb-3">
              Welcome to Smart Dukan 2.0! Choose your role to explore the dashboard:
            </p>
            <div className="flex flex-col gap-2">
              <Link
                to="/login"
                className="text-xs py-2 px-3 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 flex items-center justify-between border border-purple-500/30"
              >
                <span>Shopkeeper Login</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
              <Link
                to="/register?role=CUSTOMER"
                className="text-xs py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 flex items-center justify-between border border-white/10"
              >
                <span>Order as Customer</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
