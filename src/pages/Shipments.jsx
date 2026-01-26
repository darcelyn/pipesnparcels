import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Download, 
  ExternalLink,
  Printer,
  MoreVertical,
  ChevronRight,
  RefreshCw
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
  const [expandedShipments, setExpandedShipments] = useState([]);

  const { data: shipments = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['shipments'],
    queryFn: () => base44.entities.Shipment.list('-created_date', 200)
  });

  const filteredShipments = useMemo(() => {
    return shipments.filter(shipment => {
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesSearch = 
          shipment.order_number?.toLowerCase().includes(search) ||
          shipment.tracking_number?.toLowerCase().includes(search) ||
          shipment.customer_name?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }
      
      if (filters.carrier !== 'all' && shipment.carrier !== filters.carrier) {
        return false;
      }
      
      if (filters.status !== 'all' && shipment.status !== filters.status) {
        return false;
      }
      
      if (filters.category !== 'all' && shipment.shipment_category !== filters.category) {
        return false;
      }
      
      if (filters.dateRange !== 'all') {
        const days = parseInt(filters.dateRange);
        const cutoffDate = subDays(new Date(), days);
        const shipmentDate = new Date(shipment.created_date);
        if (shipmentDate < cutoffDate) return false;
      }
      
      return true;
    });
  }, [shipments, filters]);

  const toggleExpand = (shipmentId) => {
    setExpandedShipments(prev =>
      prev.includes(shipmentId)
        ? prev.filter(id => id !== shipmentId)
        : [...prev, shipmentId]
    );
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
    a.download = `tracking-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const totalCost = filteredShipments.reduce((sum, s) => sum + (s.shipping_cost || 0), 0);

  const getStatusColor = (status) => {
    const colors = {
      label_created: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      in_transit: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      delivered: 'bg-green-500/20 text-green-300 border-green-500/30',
      exception: 'bg-red-500/20 text-red-300 border-red-500/30',
      out_for_delivery: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const getCarrierColor = (carrier) => {
    const colors = {
      fedex: 'bg-purple-600/20 text-purple-300 border-purple-600/30',
      usps: 'bg-blue-600/20 text-blue-300 border-blue-600/30'
    };
    return colors[carrier] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const getCategoryColor = (category) => {
    const colors = {
      order: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      custom_part: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      sample: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      return: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      other: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    };
    return colors[category] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const formatStatusLabel = (status) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">TRACKING</h1>
          <p className="text-sm text-gray-400">
            {filteredShipments.length} shipment{filteredShipments.length !== 1 ? 's' : ''} · ${totalCost.toFixed(2)} total
          </p>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex-1 flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search orders, tracking..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 bg-[#252525] border-[#3a3a3a] text-white placeholder:text-gray-500 h-9 text-sm"
              />
            </div>
            
            <Select value={filters.carrier} onValueChange={(value) => setFilters(prev => ({ ...prev, carrier: value }))}>
              <SelectTrigger className="w-36 bg-[#252525] border-[#3a3a3a] text-white h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#252525] border-[#3a3a3a]">
                <SelectItem value="all">All Carriers</SelectItem>
                <SelectItem value="fedex">FedEx</SelectItem>
                <SelectItem value="usps">USPS</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-36 bg-[#252525] border-[#3a3a3a] text-white h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#252525] border-[#3a3a3a]">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="label_created">Label Created</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="exception">Exception</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
              <SelectTrigger className="w-36 bg-[#252525] border-[#3a3a3a] text-white h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#252525] border-[#3a3a3a]">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="order">Orders</SelectItem>
                <SelectItem value="custom_part">Custom Parts</SelectItem>
                <SelectItem value="sample">Samples</SelectItem>
                <SelectItem value="return">Returns</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
              <SelectTrigger className="w-36 bg-[#252525] border-[#3a3a3a] text-white h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#252525] border-[#3a3a3a]">
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="bg-transparent border-[#3a3a3a] text-white hover:bg-[#2a2a2a] h-9 text-sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              REFRESH
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="bg-transparent border-[#3a3a3a] text-white hover:bg-[#2a2a2a] h-9 text-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              EXPORT CSV
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#252525] rounded-lg border border-[#3a3a3a] overflow-hidden">
          {/* Table Header */}
          <div className="bg-[#2d2d4a] border-b border-[#3a3a3a]">
            <div className="grid grid-cols-[40px_120px_160px_200px_120px_120px_120px_120px_40px] gap-4 px-4 py-3 text-xs font-medium text-gray-400 uppercase">
              <div></div>
              <div>ORDER #</div>
              <div>TRACKING #</div>
              <div>CUSTOMER</div>
              <div>CARRIER</div>
              <div>STATUS</div>
              <div>CATEGORY</div>
              <div>SHIP DATE</div>
              <div></div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[#3a3a3a]">
            {isLoading ? (
              <div className="py-20 text-center text-gray-500">Loading...</div>
            ) : filteredShipments.length === 0 ? (
              <div className="py-20 text-center text-gray-500">No shipments found</div>
            ) : (
              filteredShipments.map((shipment) => (
                <div key={shipment.id}>
                  <div className="grid grid-cols-[40px_120px_160px_200px_120px_120px_120px_120px_40px] gap-4 px-4 py-3 text-sm items-center hover:bg-[#2a2a2a] transition-colors">
                    <div className="flex items-center">
                      <button
                        onClick={() => toggleExpand(shipment.id)}
                        className="hover:bg-[#3a3a3a] p-1 rounded"
                      >
                        <ChevronRight
                          className={`w-4 h-4 text-gray-400 transition-transform ${
                            expandedShipments.includes(shipment.id) ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div className="text-white font-medium">{shipment.order_number || '-'}</div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300 font-mono text-xs">{shipment.tracking_number}</span>
                      {shipment.tracking_number && (
                        <button
                          onClick={() => handleTrack(shipment)}
                          className="text-blue-400 hover:text-blue-300"
                          title="Track Package"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    
                    <div>
                      <div className="text-white text-sm">{shipment.customer_name}</div>
                      <div className="text-gray-400 text-xs truncate">
                        {shipment.destination_address?.city}, {shipment.destination_address?.state}
                      </div>
                    </div>
                    
                    <div>
                      <Badge className={`${getCarrierColor(shipment.carrier)} border text-xs px-2 py-0.5 uppercase`}>
                        {shipment.carrier}
                      </Badge>
                    </div>
                    
                    <div>
                      <Badge className={`${getStatusColor(shipment.status)} border text-xs px-2 py-0.5`}>
                        {formatStatusLabel(shipment.status)}
                      </Badge>
                    </div>
                    
                    <div>
                      <Badge className={`${getCategoryColor(shipment.shipment_category)} border text-xs px-2 py-0.5`}>
                        {shipment.shipment_category?.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="text-gray-300 text-xs">
                      {shipment.ship_date ? format(new Date(shipment.ship_date), 'MMM d, yyyy') : '-'}
                    </div>
                    
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#3a3a3a]">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#252525] border-[#3a3a3a]">
                          {shipment.tracking_number && (
                            <DropdownMenuItem
                              onClick={() => handleTrack(shipment)}
                              className="text-white hover:bg-[#3a3a3a]"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Track Package
                            </DropdownMenuItem>
                          )}
                          {shipment.label_url && (
                            <DropdownMenuItem
                              onClick={() => handleReprint(shipment)}
                              className="text-white hover:bg-[#3a3a3a]"
                            >
                              <Printer className="w-4 h-4 mr-2" />
                              Reprint Label
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {expandedShipments.includes(shipment.id) && (
                    <div className="bg-[#1f1f1f] border-t border-[#3a3a3a] px-4 py-4">
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Destination</h4>
                          <div className="text-sm text-gray-300 space-y-1">
                            <div>{shipment.destination_address?.street1}</div>
                            {shipment.destination_address?.street2 && <div>{shipment.destination_address.street2}</div>}
                            <div>
                              {shipment.destination_address?.city}, {shipment.destination_address?.state} {shipment.destination_address?.zip}
                            </div>
                            <div>{shipment.destination_address?.country || 'US'}</div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Service Details</h4>
                          <div className="space-y-2">
                            <div className="text-sm text-gray-300">
                              <span className="text-gray-400">Service:</span> {shipment.service_type}
                            </div>
                            <div className="text-sm text-gray-300">
                              <span className="text-gray-400">Weight:</span> {shipment.weight} lbs
                            </div>
                            <div className="text-sm text-gray-300">
                              <span className="text-gray-400">Box:</span> {shipment.box_type || 'Custom'}
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Cost & Timing</h4>
                          <div className="space-y-2">
                            <div className="text-sm text-gray-300">
                              <span className="text-gray-400">Cost:</span> ${shipment.shipping_cost?.toFixed(2) || '0.00'}
                            </div>
                            {shipment.estimated_delivery && (
                              <div className="text-sm text-gray-300">
                                <span className="text-gray-400">Est. Delivery:</span> {format(new Date(shipment.estimated_delivery), 'MMM d')}
                              </div>
                            )}
                            {shipment.actual_delivery && (
                              <div className="text-sm text-green-400">
                                <span className="text-gray-400">Delivered:</span> {format(new Date(shipment.actual_delivery), 'MMM d')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}