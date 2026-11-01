import { motion } from 'framer-motion';

export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        {/* Animated logo mark */}
        <div className="relative h-16 w-16">
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-brand"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
          <div className="absolute inset-1 rounded-xl bg-surface flex items-center justify-center">
            <span className="text-2xl font-bold text-gradient-brand font-display">S</span>
          </div>
        </div>
        <p className="text-sm text-white/40 animate-pulse">Loading Smart Dukan…</p>
      </motion.div>
    </div>
  );
}
