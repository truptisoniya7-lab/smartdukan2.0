import { DashboardLayout } from './DashboardLayout';
import { Card } from '@/shared/ui/Card';
import { ShoppingBag } from 'lucide-react';

export default function OrderQueuePage() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-display">Order Queue</h1>
          <p className="text-white/50 text-sm mt-1">Incoming orders — accept, pack, and dispatch</p>
        </div>
        <Card>
          <div className="py-20 text-center text-white/30">
            <ShoppingBag className="h-10 w-10 mx-auto mb-4 opacity-30" />
            <p className="text-base font-medium">Order management coming in M2</p>
            <p className="text-sm mt-2 text-white/20">
              Full order queue, accept/reject, substitutions, and real-time status updates via WebSocket.
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
