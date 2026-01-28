import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import OrderCard from "@/components/orders/OrderCard";
import OrderFilters from "@/components/orders/OrderFilters";
import { 
  RefreshCw, 
  Truck,
  Loader2,
  Tags
} from "lucide-react";

export default function ReadyToShip() {
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    priority: 'all',
    source: 'all'
  });

  const { data: orders = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ready-to-ship-orders'],
    queryFn: () => base44.entities.Order.filter({ status: 'processing' })
  });

  const filteredOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesSearch = 
          order.order_number?.toLowerCase().includes(search) ||
          order.customer_name?.toLowerCase().includes(search) ||
          order.customer_email?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }
      
      // Priority filter
      if (filters.priority !== 'all' && order.priority !== filters.priority) {
        return false;
      }
      
      // Source filter
      if (filters.source !== 'all' && order.source !== filters.source) {
        return false;
      }
      
      return true;
    });
    
    // Sort by priority: rush > priority > normal
    const priorityOrder = { rush: 0, priority: 1, normal: 2 };
    filtered.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      // Then by updated date (most recently moved to shipping)
      return new Date(b.updated_date) - new Date(a.updated_date);
    });
    
    return filtered;
  }, [orders, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      priority: 'all',
      source: 'all'
    });
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const handleCreateLabel = (order) => {
    window.location.href = createPageUrl('CreateLabel') + `?orderId=${order.id}`;
  };

  const handleBatchCreateLabels = () => {
    const orderIds = selectedOrders.join(',');
    window.location.href = createPageUrl('CreateLabel') + `?orderIds=${orderIds}`;
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">READY TO SHIP</h1>
          <p className="text-sm text-gray-400">
            {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} ready for label creation
          </p>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <OrderFilters 
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
              hideStatusFilter
            />
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
            {selectedOrders.length > 0 && (
              <Button 
                size="sm"
                onClick={handleBatchCreateLabels}
                className="bg-[#e91e63] hover:bg-[#d81b60] h-9 text-sm font-semibold"
              >
                <Tags className="w-4 h-4 mr-2" />
                CREATE {selectedOrders.length} LABEL{selectedOrders.length !== 1 ? 'S' : ''}
              </Button>
            )}
          </div>
        </div>

        {/* Select All */}
        {filteredOrders.length > 0 && (
          <div className="flex items-center gap-3 mb-4 px-1">
            <Checkbox 
              checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
              onCheckedChange={handleSelectAll}
              className="border-gray-500"
            />
            <span className="text-sm text-gray-400">
              {selectedOrders.length > 0 
                ? `${selectedOrders.length} selected`
                : 'Select all'
              }
            </span>
          </div>
        )}

        {/* Orders List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <Truck className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No orders ready to ship</h3>
            <p className="text-gray-400">
              {filters.search || filters.priority !== 'all' 
                ? 'Try adjusting your filters'
                : 'Orders moved from staging will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                selected={selectedOrders.includes(order.id)}
                onSelect={handleSelectOrder}
                onCreateLabel={handleCreateLabel}
                showCheckbox
              />
            ))}
          </div>
        )}
      </div>

      {selectedOrders.length > 0 && (
        <PrintOrderList orders={orders.filter(o => selectedOrders.includes(o.id))} />
      )}
    </div>
  );
}