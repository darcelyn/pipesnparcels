import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ShipmentCard from "@/components/shipments/ShipmentCard";
import { 
  Search, 
  Download, 
  Truck,
  Filter,
  Loader2
} from "lucide-react";
import { format, subDays } from "date-fns";

export default function Shipments() {
  const [filters, setFilters] = useState({
    search: '',
    carrier: 'all',
    status: 'all',
    category: 'all',
    dateRange: '30'
  });

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['shipments'],
    queryFn: () => base44.entities.Shipment.list('-created_date', 200)
  });

  const filteredShipments = useMemo(() => {
    return shipments.filter(shipment => {
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesSearch = 
          shipment.order_number?.toLowerCase().includes(search) ||
          shipment.tracking_number?.toLowerCase().includes(search) ||
          shipment.customer_name?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }
      
      // Carrier filter
      if (filters.carrier !== 'all' && shipment.carrier !== filters.carrier) {
        return false;
      }
      
      // Status filter
      if (filters.status !== 'all' && shipment.status !== filters.status) {
        return false;
      }
      
      // Category filter
      if (filters.category !== 'all' && shipment.shipment_category !== filters.category) {
        return false;
      }
      
      // Date range filter
      if (filters.dateRange !== 'all') {
        const days = parseInt(filters.dateRange);
        const cutoffDate = subDays(new Date(), days);
        const shipmentDate = new Date(shipment.created_date);
        if (shipmentDate < cutoffDate) return false;
      }
      
      return true;
    });
  }, [shipments, filters]);

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

  const handleExport = () => {
    const csvData = filteredShipments.map(s => ({
      'Order Number': s.order_number,
      'Tracking Number': s.tracking_number,
      'Carrier': s.carrier,
      'Service': s.service_type,
      'Status': s.status,
      'Customer': s.customer_name,
      'Ship Date': s.ship_date,
      'Cost': s.shipping_cost?.toFixed(2)
    }));
    
    const headers = Object.keys(csvData[0] || {});
    const csv = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shipments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const totalCost = filteredShipments.reduce((sum, s) => sum + (s.shipping_cost || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Shipment History</h1>
            <p className="text-slate-500 mt-1">
              {filteredShipments.length} shipment{filteredShipments.length !== 1 ? 's' : ''} 
              {' '} · ${totalCost.toFixed(2)} total
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleExport}
            className="border-slate-300"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-slate-200 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search orders, tracking..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-9"
                />
              </div>

              <Select 
                value={filters.carrier} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, carrier: value }))}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Carriers</SelectItem>
                  <SelectItem value="fedex">FedEx</SelectItem>
                  <SelectItem value="usps">USPS</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="label_created">Label Created</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="exception">Exception</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filters.category} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="order">Orders</SelectItem>
                  <SelectItem value="custom_part">Custom Parts</SelectItem>
                  <SelectItem value="sample">Samples</SelectItem>
                  <SelectItem value="return">Returns</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filters.dateRange} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Shipments List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : filteredShipments.length === 0 ? (
          <div className="text-center py-20">
            <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No shipments found</h3>
            <p className="text-slate-500">
              {filters.search || filters.carrier !== 'all' || filters.status !== 'all' 
                ? 'Try adjusting your filters'
                : 'Shipments will appear here after creating labels'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredShipments.map(shipment => (
              <ShipmentCard
                key={shipment.id}
                shipment={shipment}
                onReprint={handleReprint}
                onTrack={handleTrack}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}