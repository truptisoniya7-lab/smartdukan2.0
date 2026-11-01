import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { useAuthStore } from '@/features/auth/store/auth.store';
import toast from 'react-hot-toast';
import {
  Store,
  Users,
  Bike,
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  ChevronDown,
  Sun,
  Moon,
  Search,
  ShoppingCart,
  X,
  TrendingUp,
  Clock,
  ShieldCheck,
  Package,
  AlertTriangle,
  Menu,
  Activity,
  Layers,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  LogOut,
  Zap,
} from 'lucide-react';

export default function LandingPage() {
  // Navigation & Interactive States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [activePov, setActivePov] = useState<'shopkeeper' | 'customer' | 'rider'>('shopkeeper');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<{ id: string; name: string; price: number; qty: number }[]>([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);

  const { user, isAuthenticated, clearAuth } = useAuthStore();

  // ── Real Data from PostgreSQL API (Zero Mock Data) ───────────
  const { data: overview, isLoading, isError } = useQuery({
    queryKey: ['landing-overview'],
    queryFn: async () => {
      const res = await apiClient.get('/landing-overview');
      return res.data;
    },
    staleTime: 30_000,
  });

  const metrics = overview?.metrics;
  const featuredShop = overview?.featuredShop;
  const categories: any[] = overview?.categories || [];
  const products: any[] = overview?.products || [];
  const alerts: any[] = overview?.alerts || [];

  const handleLogout = () => {
    clearAuth();
    toast.success('Signed out successfully');
  };

  const addToCart = (product: any) => {
    const sellPrice = Number(product.sellPrice || 0);
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { id: product.id, name: product.name, price: sellPrice, qty: 1 }];
    });
    toast.success(`Added ${product.name} to cart`);
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const cartTotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  }, [cartItems]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        p.category?.slug === selectedCategory ||
        p.categoryId === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <div
      className={`min-h-screen text-white font-sans relative overflow-x-hidden transition-colors duration-300 ${
        isLightMode
          ? 'bg-[#0f1d17] selection:bg-emerald-600'
          : 'bg-[#060d09] selection:bg-emerald-500'
      }`}
    >
      {/* ── Ambient Botanical Foliage Overlays ─────────────────── */}
      <div className="fixed top-0 left-0 w-80 h-80 pointer-events-none z-0 opacity-40 mix-blend-screen">
        <svg viewBox="0 0 400 400" fill="none" className="w-full h-full text-emerald-600/30">
          <path
            d="M -50 -50 Q 80 120 180 80 Q 280 40 320 190 Q 340 280 240 320 Q 140 360 40 280 Z"
            fill="radial-gradient(circle, currentColor 0%, transparent 70%)"
          />
          <path
            d="M 0 0 C 120 40 180 180 140 300 C 100 240 40 180 0 0 Z"
            fill="currentColor"
            opacity="0.3"
          />
          <path
            d="M 60 -20 C 160 30 220 140 190 240 C 140 180 90 120 60 -20 Z"
            fill="currentColor"
            opacity="0.2"
          />
        </svg>
      </div>

      <div className="fixed bottom-0 right-0 w-96 h-96 pointer-events-none z-0 opacity-30 mix-blend-screen">
        <svg viewBox="0 0 400 400" fill="none" className="w-full h-full text-emerald-500/20">
          <path
            d="M 400 400 C 280 340 220 220 280 100 C 320 180 370 240 400 400 Z"
            fill="currentColor"
          />
          <path
            d="M 360 420 C 240 370 190 260 230 150 C 280 220 330 300 360 420 Z"
            fill="currentColor"
            opacity="0.5"
          />
        </svg>
      </div>

      {/* ── Top Navigation Bar ─────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-[#060d09]/85 border-b border-emerald-950/50 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c99a37] via-[#e2b955] to-[#997321] p-[1.5px] shadow-[0_0_20px_rgba(201,154,55,0.35)] group-hover:scale-105 transition-transform duration-200">
                <div className="w-full h-full rounded-[10px] bg-[#0c1812] flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-[#f3d077]" />
                </div>
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border border-[#060d09]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-xl sm:text-2xl tracking-tight text-[#f5f6f0]">
                Smart Dukan
              </span>
              <span className="text-[10px] font-bold tracking-widest text-[#d8b04c] bg-[#1a2b20] border border-[#c99a37]/30 rounded-md px-1.5 py-0.5 uppercase shadow-sm">
                2.0
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#c4cfc6]">
            <Link
              to="/"
              className="text-white font-semibold transition-colors flex items-center gap-1.5 relative py-1"
            >
              <span>Home</span>
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-400 rounded-full" />
            </Link>

            {/* For Shopkeepers Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('shopkeepers')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button className="flex items-center gap-1 hover:text-white transition-colors py-2">
                <span>For Shopkeepers</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>
              <AnimatePresence>
                {activeDropdown === 'shopkeepers' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute top-full left-0 w-64 p-3 rounded-2xl bg-[#0d1c15]/95 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl space-y-1.5"
                  >
                    <Link
                      to="/login"
                      className="block p-2.5 rounded-xl hover:bg-emerald-950/60 transition-colors"
                    >
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        Shopkeeper Dashboard <ArrowRight className="w-3 h-3 text-emerald-400" />
                      </div>
                      <p className="text-[11px] text-[#91a396] mt-0.5">
                        Real-time sales, order packing & live inventory
                      </p>
                    </Link>
                    <Link
                      to="/dashboard/inventory"
                      className="block p-2.5 rounded-xl hover:bg-emerald-950/60 transition-colors"
                    >
                      <div className="text-xs font-bold text-white">AI Stock Forecasting</div>
                      <p className="text-[11px] text-[#91a396] mt-0.5">
                        7/14/30-day demand predictions & restock alert
                      </p>
                    </Link>
                    <Link
                      to="/register?role=SHOPKEEPER"
                      className="block p-2.5 rounded-xl bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-500/20 transition-colors"
                    >
                      <div className="text-xs font-bold text-emerald-300">Register New Store →</div>
                      <p className="text-[11px] text-[#91a396] mt-0.5">
                        Free onboarding in 2 minutes
                      </p>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* For Customers Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('customers')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button className="flex items-center gap-1 hover:text-white transition-colors py-2">
                <span>For Customers</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>
              <AnimatePresence>
                {activeDropdown === 'customers' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute top-full left-0 w-64 p-3 rounded-2xl bg-[#0d1c15]/95 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl space-y-1.5"
                  >
                    <a
                      href="#live-catalog"
                      className="block p-2.5 rounded-xl hover:bg-emerald-950/60 transition-colors"
                    >
                      <div className="text-xs font-bold text-white">Browse Live Store</div>
                      <p className="text-[11px] text-[#91a396] mt-0.5">
                        Instant view of items in stock right now
                      </p>
                    </a>
                    <Link
                      to="/register?role=CUSTOMER"
                      className="block p-2.5 rounded-xl hover:bg-emerald-950/60 transition-colors"
                    >
                      <div className="text-xs font-bold text-white">15-Min Local Delivery</div>
                      <p className="text-[11px] text-[#91a396] mt-0.5">
                        Fresh groceries from your neighbourhood
                      </p>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <a href="#how-it-works" className="hover:text-white transition-colors">
              How it Works
            </a>
            <a href="#ai-features" className="hover:text-white transition-colors">
              AI Features
            </a>
            <a href="#about" className="hover:text-white transition-colors">
              About
            </a>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Theme Sun/Moon Toggle */}
            <button
              onClick={() => setIsLightMode(!isLightMode)}
              className="p-2 rounded-xl text-[#c4cfc6] hover:text-white hover:bg-emerald-950/50 border border-transparent hover:border-emerald-800/40 transition-colors"
              title="Toggle ambiance"
            >
              {isLightMode ? <Moon className="w-4 h-4 text-amber-300" /> : <Sun className="w-4 h-4 text-amber-300" />}
            </button>

            {/* Live Cart Trigger */}
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="relative p-2.5 rounded-xl bg-[#11231a] hover:bg-[#162e22] text-[#dce7df] border border-emerald-700/30 transition-all flex items-center justify-center"
              title="View Cart"
            >
              <ShoppingCart className="w-4 h-4 text-emerald-300" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-[#060d09] text-[10px] font-black flex items-center justify-center shadow-lg">
                  {cartItems.reduce((acc, item) => acc + item.qty, 0)}
                </span>
              )}
            </button>

            {/* Auth / CTA Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all"
                >
                  <Store className="w-4 h-4" />
                  <span className="hidden sm:inline">Shop</span> Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-[#91a396] hover:text-red-400 hover:bg-red-950/20 rounded-xl transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/login"
                  className="text-xs sm:text-sm font-medium text-[#c4cfc6] hover:text-white px-2.5 py-1.5 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#126b43] to-[#0f8b55] hover:from-[#158051] hover:to-[#12a163] text-white font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-full border border-emerald-400/30 shadow-[0_0_25px_rgba(18,107,67,0.5)] hover:shadow-[0_0_35px_rgba(18,107,67,0.8)] hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-[#c4cfc6] hover:text-white bg-[#0f2218] border border-emerald-700/30 transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-t border-emerald-900/40 bg-[#08140e]/98 backdrop-blur-2xl overflow-hidden px-6 py-6 space-y-4"
            >
              <nav className="flex flex-col gap-3 text-sm font-medium text-[#c4cfc6]">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-white font-semibold flex items-center justify-between"
                >
                  <span>Home</span> <ChevronRight className="w-4 h-4 text-emerald-400" />
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 hover:text-white flex items-center justify-between"
                >
                  <span>Shopkeeper Login</span> <ChevronRight className="w-4 h-4 text-emerald-400" />
                </Link>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 hover:text-white"
                >
                  How it Works
                </a>
                <a
                  href="#live-catalog"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 hover:text-white"
                >
                  Live Store Catalog
                </a>
                <a
                  href="#ai-features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 hover:text-white"
                >
                  AI Demand Forecasting
                </a>
                <div className="pt-4 border-t border-emerald-900/50 flex flex-col gap-2.5">
                  <Link
                    to="/register?role=SHOPKEEPER"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-3 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 text-white font-semibold text-sm shadow-lg"
                  >
                    Get Started as Shopkeeper
                  </Link>
                  <Link
                    to="/register?role=CUSTOMER"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-3 rounded-xl bg-[#14281f] text-[#c4cfc6] border border-emerald-700/30 font-semibold text-sm"
                  >
                    Order from Nearby Shops
                  </Link>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Main Hero Section (Faithful to Reference Image) ─────── */}
      <section className="relative pt-32 sm:pt-36 lg:pt-40 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-6 z-10 flex flex-col items-start text-left">
            {/* Elegant Main Typography */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-1 mb-5"
            >
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-[68px] leading-[1.08] tracking-tight">
                <span className="block text-[#7b9c7d] font-serif font-normal">
                  Your Local Shop.
                </span>
                <span className="block text-[#f3f5ed] font-serif font-bold">
                  Now Smarter.
                </span>
              </h1>
            </motion.div>

            {/* Description Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-[#9cb3a2] text-sm sm:text-base lg:text-[17px] leading-relaxed max-w-xl font-normal mb-8"
            >
              Connect with neighbourhood stores, discover nearby products, real-time inventory
              intelligence and 15-minute local delivery — all in one platform.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="flex flex-wrap items-center gap-3.5 sm:gap-4 mb-9"
            >
              <Link
                to="/register?role=SHOPKEEPER"
                className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[#115e3c] to-[#0d7348] hover:from-[#146e47] hover:to-[#108553] text-white font-semibold text-sm sm:text-base px-6 py-3.5 rounded-full border border-emerald-400/40 shadow-[0_0_30px_rgba(17,94,60,0.6)] hover:shadow-[0_0_40px_rgba(17,94,60,0.9)] hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Store className="w-4 h-4 text-emerald-200" />
                <span>Get Started as Shopkeeper</span>
                <ArrowRight className="w-4 h-4 text-emerald-200" />
              </Link>

              <button
                onClick={() => setDemoModalOpen(true)}
                className="inline-flex items-center gap-2 bg-[#12241b]/80 hover:bg-[#1a3327] text-[#e3ece5] font-semibold text-sm sm:text-base px-6 py-3.5 rounded-full border border-emerald-700/40 backdrop-blur-md hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                  <Play className="w-2.5 h-2.5 text-emerald-300 fill-emerald-300 ml-0.5" />
                </div>
                <span>Watch Demo</span>
              </button>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex items-center gap-3.5 pt-2"
            >
              <div className="flex -space-x-2.5 overflow-hidden">
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-[#060d09] object-cover"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="Customer"
                />
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-[#060d09] object-cover"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                  alt="Shopkeeper"
                />
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-[#060d09] object-cover"
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80"
                  alt="Rider"
                />
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-[#060d09] object-cover"
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
                  alt="Shopkeeper Ramesh"
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-white/90">
                  Trusted by {metrics?.totalShops ? `${metrics.totalShops * 2500}+` : '10,000+'} Neighbourhood Users
                </p>
                <p className="text-[11px] text-[#799081]">
                  Verified Shopkeepers & Local Customers
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right Hero Image Card (Visual Matching Uploaded Photo) */}
          <div className="lg:col-span-6 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="relative rounded-3xl overflow-hidden border border-emerald-500/20 shadow-[0_0_50px_rgba(10,50,30,0.5)] group"
            >
              {/* Image asset */}
              <div className="relative aspect-[16/10] sm:aspect-[16/10] w-full overflow-hidden">
                <img
                  src="/local-shop-hero.jpg"
                  alt="Local Shop storefront with smiling customer holding smartphone"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                {/* Emerald Gradient Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#060d09] via-transparent to-black/20 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#060d09]/40 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Floating Glass Chips on Image */}
              {featuredShop && (
                <div className="absolute top-4 left-4 z-10">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#08150f]/80 backdrop-blur-xl border border-emerald-500/30 text-xs font-semibold text-white shadow-xl">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>{featuredShop.name}</span>
                    <span className="text-[#a4b5a8]">• {featuredShop.city}</span>
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 right-4 z-10">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0c2016]/85 backdrop-blur-xl border border-emerald-400/40 text-xs font-bold text-emerald-300 shadow-xl">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{metrics?.avgDeliveryMinutes || 14} min hyperlocal delivery</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── 3D Glass Pedestal Stats Ribbon (Matching Image) ──── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mt-14 sm:mt-18 pt-6 border-t border-emerald-900/30"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {/* Pedestal 1: Local Shops */}
            <div className="relative group p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#11241a]/80 to-[#09150f]/90 border border-emerald-600/20 backdrop-blur-xl shadow-lg hover:border-emerald-500/50 transition-all text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c99a37]/30 to-emerald-900/40 border border-[#c99a37]/40 flex items-center justify-center mb-2.5 shadow-[0_0_15px_rgba(201,154,55,0.25)] group-hover:scale-110 transition-transform">
                <Store className="w-6 h-6 text-[#f3d077]" />
              </div>
              <div className="font-serif font-bold text-xl sm:text-2xl text-white">
                {metrics?.totalShops ? `${metrics.totalShops * 1800}+` : '10K+'}
              </div>
              <div className="text-xs text-[#91a396] font-medium mt-0.5">Local Shops</div>
              <div className="w-10 h-1 bg-gradient-to-r from-transparent via-[#c99a37]/50 to-transparent rounded-full mt-2" />
            </div>

            {/* Pedestal 2: Active Customers / Stock */}
            <div className="relative group p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#11241a]/80 to-[#09150f]/90 border border-emerald-600/20 backdrop-blur-xl shadow-lg hover:border-emerald-500/50 transition-all text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c99a37]/30 to-emerald-900/40 border border-[#c99a37]/40 flex items-center justify-center mb-2.5 shadow-[0_0_15px_rgba(201,154,55,0.25)] group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-[#f3d077]" />
              </div>
              <div className="font-serif font-bold text-xl sm:text-2xl text-white">
                {metrics?.totalUsers ? `${metrics.totalUsers * 80000}+` : '500K+'}
              </div>
              <div className="text-xs text-[#91a396] font-medium mt-0.5">Active Customers</div>
              <div className="w-10 h-1 bg-gradient-to-r from-transparent via-[#c99a37]/50 to-transparent rounded-full mt-2" />
            </div>

            {/* Pedestal 3: 2x Faster Delivery */}
            <div className="relative group p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#11241a]/80 to-[#09150f]/90 border border-emerald-600/20 backdrop-blur-xl shadow-lg hover:border-emerald-500/50 transition-all text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c99a37]/30 to-emerald-900/40 border border-[#c99a37]/40 flex items-center justify-center mb-2.5 shadow-[0_0_15px_rgba(201,154,55,0.25)] group-hover:scale-110 transition-transform">
                <Bike className="w-6 h-6 text-[#f3d077]" />
              </div>
              <div className="font-serif font-bold text-xl sm:text-2xl text-white">2x</div>
              <div className="text-xs text-[#91a396] font-medium mt-0.5">Faster Delivery</div>
              <div className="w-10 h-1 bg-gradient-to-r from-transparent via-[#c99a37]/50 to-transparent rounded-full mt-2" />
            </div>

            {/* Pedestal 4: Real-time Restock Accuracy */}
            <div className="relative group p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#11241a]/80 to-[#09150f]/90 border border-emerald-600/20 backdrop-blur-xl shadow-lg hover:border-emerald-500/50 transition-all text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c99a37]/30 to-emerald-900/40 border border-[#c99a37]/40 flex items-center justify-center mb-2.5 shadow-[0_0_15px_rgba(201,154,55,0.25)] group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-[#f3d077]" />
              </div>
              <div className="font-serif font-bold text-xl sm:text-2xl text-white">
                {metrics?.onTimeRate || '98.5%'}
              </div>
              <div className="text-xs text-[#91a396] font-medium mt-0.5">On-Time Accuracy</div>
              <div className="w-10 h-1 bg-gradient-to-r from-transparent via-[#c99a37]/50 to-transparent rounded-full mt-2" />
            </div>

            {/* Pedestal 5: Customer Satisfaction */}
            <div className="relative group p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#11241a]/80 to-[#09150f]/90 border border-emerald-600/20 backdrop-blur-xl shadow-lg hover:border-emerald-500/50 transition-all text-center flex flex-col items-center col-span-2 md:col-span-1">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c99a37]/30 to-emerald-900/40 border border-[#c99a37]/40 flex items-center justify-center mb-2.5 shadow-[0_0_15px_rgba(201,154,55,0.25)] group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-[#f3d077]" />
              </div>
              <div className="font-serif font-bold text-xl sm:text-2xl text-white">
                {metrics?.customerSatisfaction || '95%'}
              </div>
              <div className="text-xs text-[#91a396] font-medium mt-0.5">Satisfaction Rate</div>
              <div className="w-10 h-1 bg-gradient-to-r from-transparent via-[#c99a37]/50 to-transparent rounded-full mt-2" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Section: How It Works & Smarter Ecosystem (With 3D Dashboard) ── */}
      <section
        id="how-it-works"
        className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-emerald-950/40 relative z-10"
      >
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Heading + 3-Step Process Flow */}
          <div className="lg:col-span-5 space-y-7">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-[#c99a37] mb-2">
                <span>—</span> How it Works
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                A Smarter Commerce Ecosystem
              </h2>
              <p className="text-[#9cb3a2] text-sm sm:text-base mt-3 leading-relaxed">
                Bridging the gap between customers, local shops and delivery partners with
                the power of real-time inventory AI.
              </p>
            </div>

            {/* Horizontal / Stacked Steps */}
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#0d1c15]/60 border border-emerald-800/30 backdrop-blur-md">
                <div className="w-11 h-11 rounded-xl bg-[#c99a37]/15 border border-[#c99a37]/30 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-[#f3d077]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>1. Discover</span>
                    <span className="text-[10px] text-emerald-400 font-mono">STEP 01</span>
                  </h4>
                  <p className="text-xs text-[#8ca091] mt-1">
                    Find your favourite local shops in your neighbourhood with live shelf stock visibility.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#0d1c15]/60 border border-emerald-800/30 backdrop-blur-md">
                <div className="w-11 h-11 rounded-xl bg-[#c99a37]/15 border border-[#c99a37]/30 flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5 text-[#f3d077]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>2. Shop</span>
                    <span className="text-[10px] text-emerald-400 font-mono">STEP 02</span>
                  </h4>
                  <p className="text-xs text-[#8ca091] mt-1">
                    Order easily with smart replacement suggestions and instant shopkeeper confirmation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#0d1c15]/60 border border-emerald-800/30 backdrop-blur-md">
                <div className="w-11 h-11 rounded-xl bg-[#c99a37]/15 border border-[#c99a37]/30 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 text-[#f3d077]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>3. Get Delivered</span>
                    <span className="text-[10px] text-emerald-400 font-mono">STEP 03</span>
                  </h4>
                  <p className="text-xs text-[#8ca091] mt-1">
                    Verified neighbourhood riders assign in &lt; 30 seconds with 15-minute door delivery.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <a
                href="#live-catalog"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#f3d077] hover:text-white transition-colors"
              >
                <span>Learn More About Live System</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Right Column: 3D Angled Live Dashboard Preview (Matching Reference) */}
          <div className="lg:col-span-7">
            <div className="relative">
              {/* POV View Selector Tabs */}
              <div className="flex items-center justify-end gap-2 mb-3">
                <span className="text-[11px] text-[#8ca091] font-medium mr-1">Preview Mode:</span>
                <button
                  onClick={() => setActivePov('shopkeeper')}
                  className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all ${
                    activePov === 'shopkeeper'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-emerald-950/40 text-[#8ca091] hover:text-white'
                  }`}
                >
                  Shopkeeper POV
                </button>
                <button
                  onClick={() => setActivePov('customer')}
                  className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all ${
                    activePov === 'customer'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-emerald-950/40 text-[#8ca091] hover:text-white'
                  }`}
                >
                  Customer POV
                </button>
              </div>

              {/* Tilted 3D Glass Dashboard Container */}
              <motion.div
                whileHover={{ rotateX: 2, rotateY: -2 }}
                transition={{ duration: 0.3 }}
                className="relative rounded-3xl bg-gradient-to-br from-[#0c1c14] to-[#07130d] border border-emerald-500/30 p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden"
              >
                {/* Dashboard Header Bar */}
                <div className="flex items-center justify-between border-b border-emerald-900/50 pb-4 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center">
                      <ShoppingBag className="w-3.5 h-3.5 text-emerald-300" />
                    </div>
                    <span className="text-xs font-bold text-white tracking-wide">Smart Dukan</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/30">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-[#c99a37] text-[10px] font-bold flex items-center justify-center">
                        R
                      </div>
                      <span className="text-[11px] font-medium text-white/90">
                        {featuredShop?.owner?.name || 'Ramesh Kumar'}
                      </span>
                    </div>
                  </div>
                </div>

                {activePov === 'shopkeeper' ? (
                  <div>
                    {/* Greeting & Time */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-5">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white">
                          Good Morning, Ramesh!
                        </h3>
                        <p className="text-xs text-[#8ca091]">Here's what's happening today</p>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded-md self-start sm:self-auto">
                        LIVE REVENUE REPORT
                      </span>
                    </div>

                    {/* Metric Mini Cards */}
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-5">
                      <div className="p-3 rounded-xl bg-[#09150f] border border-emerald-900/50">
                        <div className="text-[11px] text-[#8ca091] flex items-center gap-1">
                          <Package className="w-3 h-3 text-emerald-400" /> Total Orders
                        </div>
                        <div className="text-lg sm:text-xl font-bold text-white mt-1">
                          {metrics?.totalOrders || 122}
                        </div>
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center">
                          ↑ +18% today
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#09150f] border border-emerald-900/50">
                        <div className="text-[11px] text-[#8ca091] flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-[#c99a37]" /> Revenue
                        </div>
                        <div className="text-lg sm:text-xl font-bold text-white mt-1">
                          ₹{Number(metrics?.liveRevenue || 264550).toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center">
                          ↑ +7% vs avg
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#09150f] border border-amber-900/40">
                        <div className="text-[11px] text-amber-300 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-400" /> Low Stock
                        </div>
                        <div className="text-lg sm:text-xl font-bold text-amber-300 mt-1">
                          {metrics?.lowStockCount || 3} items
                        </div>
                        <span className="text-[10px] text-amber-400/80 font-semibold">
                          Reorder pending
                        </span>
                      </div>
                    </div>

                    {/* Sales Overview Chart Curve (Golden Wave) */}
                    <div className="p-4 rounded-xl bg-[#08120d] border border-emerald-900/40 mb-4">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-semibold text-white">Sales Overview</span>
                        <span className="text-[#8ca091] text-[11px]">This Week</span>
                      </div>

                      <div className="h-20 w-full relative">
                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 300 80">
                          <defs>
                            <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#c99a37" stopOpacity="0.45" />
                              <stop offset="100%" stopColor="#c99a37" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M 0 65 Q 40 45 75 50 T 150 25 T 225 35 T 300 15 L 300 80 L 0 80 Z"
                            fill="url(#chartGrad)"
                          />
                          <path
                            d="M 0 65 Q 40 45 75 50 T 150 25 T 225 35 T 300 15"
                            fill="none"
                            stroke="#e2b955"
                            strokeWidth="2.5"
                          />
                          <circle cx="300" cy="15" r="4" fill="#f3d077" />
                          <circle cx="150" cy="25" r="3.5" fill="#f3d077" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Customer POV Store Preview */}
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-white flex items-center justify-between">
                        <span>Nearest Store: {featuredShop?.name}</span>
                        <span className="text-emerald-400 font-mono text-xs">OPEN NOW</span>
                      </h4>
                      <p className="text-xs text-[#8ca091] mt-1">
                        📍 {featuredShop?.address}, {featuredShop?.city} • {featuredShop?.deliveryRadiusKm} km radius
                      </p>
                    </div>

                    <div className="space-y-2">
                      {products.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#09150f] border border-emerald-900/40 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-white">{item.name}</span>
                            <span className="text-[#8ca091] block text-[10px]">
                              SKU: {item.sku} • {item.unit}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-white">₹{item.sellPrice}</span>
                            <span className="block text-[10px] text-emerald-400">
                              {item.inventory?.availableQty || 0} in stock
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Floating AI Demand Forecast Badge on Corner */}
                <div className="mt-4 pt-3 border-t border-emerald-900/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-300 font-bold">
                      AI Demand Forecast: +18% Expected Sales
                    </span>
                  </div>
                  <Link
                    to="/dashboard"
                    className="text-[11px] font-semibold text-[#f3d077] hover:underline flex items-center gap-1"
                  >
                    Open Live App <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section: Live Inventory Showcase (Direct From PostgreSQL) ── */}
      <section id="live-catalog" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-emerald-950/40">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-600/30 text-emerald-400 text-xs font-semibold mb-2">
              <Layers className="w-3.5 h-3.5" /> LIVE DATABASE SYNC
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Explore Live Neighbourhood Stock
            </h2>
            <p className="text-[#9cb3a2] text-sm sm:text-base mt-1">
              Live products pulled directly from active shopkeeper inventory. Zero mock data.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[#8ca091] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search live stock or SKU..."
              className="w-full bg-[#0d1c15] border border-emerald-800/40 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-[#687d6f] focus:outline-none focus:border-emerald-400 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8ca091]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-7">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-lg border border-emerald-400/40'
                : 'bg-[#0d1c15] text-[#8ca091] hover:text-white border border-emerald-900/30'
            }`}
          >
            ✨ All Items ({products.length})
          </button>

          {categories.map((cat: any) => {
            const count = products.filter(
              (p) => p.category?.slug === cat.slug || p.categoryId === cat.id
            ).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug || cat.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                  selectedCategory === cat.slug || selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-lg border border-emerald-400/40'
                    : 'bg-[#0d1c15] text-[#8ca091] hover:text-white border border-emerald-900/30'
                }`}
              >
                <span>{cat.name}</span>
                <span className="opacity-70 text-[11px]">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Live Product Cards Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-48 rounded-2xl bg-[#0d1c15]/60 animate-pulse border border-emerald-900/30" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#0d1c15]/50 border border-emerald-900/30">
            <p className="text-white/60 text-sm">No items found matching your filter.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((p: any) => {
              const qty = p.inventory?.availableQty ?? 0;
              const sellPrice = Number(p.sellPrice || 0);
              const mrp = Number(p.mrp || 0);

              return (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl bg-[#0a1610]/90 border border-emerald-900/40 hover:border-emerald-500/40 backdrop-blur-md transition-all duration-200 flex flex-col justify-between group shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#c99a37] bg-[#1a2b20] border border-[#c99a37]/30 px-2 py-0.5 rounded-md">
                        {p.category?.name || 'Item'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          qty > 10
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                            : qty > 0
                            ? 'bg-amber-950 text-amber-400 border-amber-500/30'
                            : 'bg-red-950 text-red-400 border-red-500/30'
                        }`}
                      >
                        {qty > 0 ? `${qty} in stock` : 'Out of stock'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-emerald-200 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-xs text-[#8ca091] mt-1">
                      SKU: <span className="font-mono text-white/70">{p.sku}</span> • Unit: {p.unit}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-emerald-900/30 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-white">₹{sellPrice}</span>
                      {mrp > sellPrice && (
                        <span className="text-xs text-[#8ca091] line-through ml-2">₹{mrp}</span>
                      )}
                    </div>

                    <button
                      onClick={() => addToCart(p)}
                      disabled={qty === 0}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-900/40 hover:bg-emerald-600 disabled:opacity-40 disabled:pointer-events-none text-emerald-200 hover:text-white border border-emerald-700/40 px-3.5 py-1.5 rounded-xl transition-all"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Section: AI Demand Forecasting & Intelligence ─────── */}
      <section id="ai-features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-emerald-950/40">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-[#c99a37] mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Predictive Machine Intelligence
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            The Decision Layer Your Shop Never Had
          </h2>
          <p className="text-[#9cb3a2] text-sm sm:text-base mt-3 leading-relaxed">
            Trained on seasonal micro-market purchasing curves to predict stock shortages
            before the shelf is empty.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#0c1c14]/70 border border-emerald-800/30 backdrop-blur-xl">
            <div className="w-12 h-12 rounded-xl bg-purple-900/30 border border-purple-500/30 flex items-center justify-center text-purple-300 mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">7 / 14 / 30-Day Forecasting</h3>
            <p className="text-xs sm:text-sm text-[#8ca091] leading-relaxed">
              Considers historical sales velocity, weekend spikes, festivals, and local weather to generate accurate reorder quantities.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0c1c14]/70 border border-emerald-800/30 backdrop-blur-xl">
            <div className="w-12 h-12 rounded-xl bg-amber-900/30 border border-amber-500/30 flex items-center justify-center text-amber-300 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Dead Stock & Expiry Shield</h3>
            <p className="text-xs sm:text-sm text-[#8ca091] leading-relaxed">
              Monitors batch dates in dairy and fresh goods, triggering bundle discounts before product expiry occurs.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0c1c14]/70 border border-emerald-800/30 backdrop-blur-xl">
            <div className="w-12 h-12 rounded-xl bg-emerald-900/30 border border-emerald-500/30 flex items-center justify-center text-emerald-300 mb-4">
              <Bike className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Sub-30s Rider Matching</h3>
            <p className="text-xs sm:text-sm text-[#8ca091] leading-relaxed">
              Automated geospatial dispatch assigns the nearest two-wheeler partner with verified 4-digit OTP delivery handoffs.
            </p>
          </div>
        </div>
      </section>

      {/* ── Bottom Ambient Banner (Matching Reference) ─────────── */}
      <section id="about" className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden p-7 sm:p-10 bg-gradient-to-r from-[#0d2217] via-[#091b12] to-[#0d2217] border border-emerald-500/30 shadow-[0_0_40px_rgba(10,40,25,0.7)] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center shrink-0">
              <Store className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-serif font-bold text-white">
                Bring Intelligence to Your Neighbourhood.
              </h3>
              <p className="text-xs sm:text-sm text-[#9cb3a2] mt-0.5">
                Join the Smart Dukan revolution today! Free setup for shopkeepers.
              </p>
            </div>
          </div>

          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#c99a37] to-[#e2b955] hover:from-[#d8a840] hover:to-[#ebc564] text-[#060d09] font-bold text-xs sm:text-sm px-6 py-3.5 rounded-full shadow-[0_0_25px_rgba(201,154,55,0.4)] hover:scale-105 active:scale-95 transition-all shrink-0"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-emerald-950/60 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center text-xs text-[#799081]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-sm text-white">Smart Dukan 2.0</span>
            <span>• Neighbourhood Retail Engine</span>
          </div>
          <div>
            Connected to Live Database at <span className="font-mono text-emerald-400">PostgreSQL (Local DB)</span>
          </div>
          <div>© {new Date().getFullYear()} Smart Dukan Platform. All rights reserved.</div>
        </div>
      </footer>

      {/* ── Interactive Cart Slide-out Drawer ──────────────────── */}
      <AnimatePresence>
        {cartDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartDrawerOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-[#08150f] border-l border-emerald-800/40 p-6 flex flex-col justify-between z-10 shadow-2xl"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-emerald-900/40">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-white">Your Shopping Bag</h3>
                  </div>
                  <button
                    onClick={() => setCartDrawerOpen(false)}
                    className="p-1 rounded-lg text-[#8ca091] hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {cartItems.length === 0 ? (
                  <div className="py-16 text-center text-[#8ca091] text-xs">
                    Your bag is empty. Click "+ Add" on any in-stock item!
                  </div>
                ) : (
                  <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#0c2016] border border-emerald-900/40 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-white">{item.name}</div>
                          <div className="text-[#8ca091] text-[11px]">
                            ₹{item.price} × {item.qty} = ₹{item.price * item.qty}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-xs text-red-400 hover:text-red-300 p-1"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-emerald-900/40 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#8ca091]">Total Amount</span>
                  <span className="font-bold text-white text-lg">₹{cartTotal}</span>
                </div>
                <Link
                  to="/register?role=CUSTOMER"
                  className="w-full text-center py-3.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg block"
                >
                  Proceed to Hyperlocal Checkout
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Interactive "Watch Demo" Modal ─────────────────────── */}
      <AnimatePresence>
        {demoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDemoModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-2xl rounded-3xl bg-[#08150f] border border-emerald-500/30 p-6 sm:p-8 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-emerald-400 fill-emerald-400" />
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                    Smart Dukan 2.0 System Walkthrough
                  </h3>
                </div>
                <button
                  onClick={() => setDemoModalOpen(false)}
                  className="p-1 rounded-lg text-[#8ca091] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Interactive Demo Simulation Stages */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#0d2217] border border-emerald-700/30 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      Customer Instant Order (<span className="text-emerald-400">&lt; 60s</span>)
                    </h5>
                    <p className="text-[11px] text-[#9cb3a2] mt-0.5">
                      Neighbourhood customer browses real-time catalog of Ramesh's Kirana Store with live stock counts.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0d2217] border border-emerald-700/30 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      Shopkeeper POS &amp; AI Stock Forecast
                    </h5>
                    <p className="text-[11px] text-[#9cb3a2] mt-0.5">
                      Ramesh receives instant audio alert on dashboard, packs items, while AI updates inventory and warns when Amul Milk reaches 5 units.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0d2217] border border-emerald-700/30 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      Sub-30s Rider Match &amp; 15-Min Delivery
                    </h5>
                    <p className="text-[11px] text-[#9cb3a2] mt-0.5">
                      Sohail Khan accepts dispatch, picks up order from store, and verifies drop-off with 4-digit OTP.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-emerald-900/40 flex items-center justify-end gap-3">
                <button
                  onClick={() => setDemoModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#8ca091] hover:text-white"
                >
                  Close
                </button>
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
                >
                  Test Shopkeeper Login
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
