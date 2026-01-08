import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/dashboard/StatsCard";
import ShipmentCard from "@/components/shipments/ShipmentCard";
import OrderCard from "@/components/orders/OrderCard";
import { 
  Package, 
  Truck, 
  Clock, 
  DollarSign,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";

export default function Dashboard() {
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 50)
  });

  const { data: shipments = [], isLoading: shipmentsLoading } = useQuery({
    queryKey: ['shipments'],
    queryFn: () => base44.entities.Shipment.list('-created_date', 50)
  });

  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing');
  const rushOrders = orders.filter(o => o.priority === 'rush' || o.priority === 'priority');
  const todayShipments = shipments.filter(s => {
    const shipDate = new Date(s.created_date);
    return shipDate >= startOfDay(new Date());
  });
  const totalSpentToday = todayShipments.reduce((sum, s) => sum + (s.shipping_cost || 0), 0);

  const recentShipments = shipments.slice(0, 5);
  const pendingOrdersList = pendingOrders.slice(0, 5);

  const handleCreateLabel = (order) => {
    window.location.href = createPageUrl('CreateLabel') + `?orderId=${order.id}`;
  };

  const handleReprint = (shipment) => {
    if (shipment.label_url) {
      window.open(shipment.label_url, '_blank');
    }
  };

  const handleTrack = (shipment) => {
    let trackUrl = '';
    if (shipment.carrier === 'fedex') {
      trackUrl = `https://www.fedex.com/fedextrack/?trknbr=${shipment.tracking_number}`;
    } else if (shipment.carrier === 'usps') {
      trackUrl = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${shipment.tracking_number}`;
    }
    if (trackUrl) window.open(trackUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <div className="flex gap-3">
            <Link to={createPageUrl('Orders')}>
              <Button variant="outline" className="border-slate-300">
                View All Orders
              </Button>
            </Link>
            <Link to={createPageUrl('CreateLabel')}>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Label
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Pending Orders"
            value={pendingOrders.length}
            icon={Clock}
            color="amber"
            subtitle="Awaiting shipment"
          />
          <StatsCard
            title="Shipped Today"
            value={todayShipments.length}
            icon={Truck}
            color="teal"
            trend="+12% from yesterday"
            trendDirection="up"
          />
          <StatsCard
            title="Rush Orders"
            value={rushOrders.length}
            icon={AlertTriangle}
            color="rose"
            subtitle="Need immediate attention"
          />
          <StatsCard
            title="Spent Today"
            value={`$${totalSpentToday.toFixed(2)}`}
            icon={DollarSign}
            color="blue"
            subtitle="Shipping costs"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending Orders */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-600" />
                Orders Ready to Ship
              </CardTitle>
              <Link to={createPageUrl('Orders')}>
                <Button variant="ghost" size="sm" className="text-teal-600">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {ordersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : pendingOrdersList.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-slate-600">All caught up!</p>
                  <p className="text-sm text-slate-400">No pending orders</p>
                </div>
              ) : (
                pendingOrdersList.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    showCheckbox={false}
                    onCreateLabel={handleCreateLabel}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Shipments */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-teal-600" />
                Recent Shipments
              </CardTitle>
              <Link to={createPageUrl('Shipments')}>
                <Button variant="ghost" size="sm" className="text-teal-600">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {shipmentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : recentShipments.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No shipments yet</p>
                  <p className="text-sm text-slate-400">Create your first label</p>
                </div>
              ) : (
                recentShipments.map(shipment => (
                  <ShipmentCard
                    key={shipment.id}
                    shipment={shipment}
                    compact={true}
                    onReprint={handleReprint}
                    onTrack={handleTrack}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}