import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import OrderCard from "@/components/orders/OrderCard";
import OrderFilters from "@/components/orders/OrderFilters";
import { 
  Plus, 
  RefreshCw, 
  Package, 
  Tags,
  Loader2
} from "lucide-react";

export default function Orders() {
  const queryClient = useQueryClient();
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    source: 'all'
  });

  const syncMagentoMutation = useMutation({
    mutationFn: () => base44.functions.invoke('fetchMagentoOrders'),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      alert(`✓ Synced ${response.data.imported_count} new orders from Magento`);
    },
    onError: (error) => {
      alert(`Failed to sync: ${error.message}`);
    }
  });

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: async ({ orderIds, status }) => {
      const user = await base44.auth.me();
      const updates = orderIds.map(id => 
        base44.entities.Order.update(id, { 
          status,
          ...(status === 'staging' ? { staged_by: user.email } : {})
        })
      );
      return Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSelectedOrders([]);
    }
  });

  const { data: orders = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 100)
  });

  const filteredOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      // Only show pending orders that haven't been moved to production workflow
      if (order.status !== 'pending') {
        return false;
      }

      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesSearch = 
          order.order_number?.toLowerCase().includes(search) ||
          order.customer_name?.toLowerCase().includes(search) ||
          order.customer_email?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }
      
      // Status filter
      if (filters.status !== 'all' && order.status !== filters.status) {
        return false;
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
      // Then by created date (newest first)
      return new Date(b.created_date) - new Date(a.created_date);
    });
    
    return filtered;
  }, [orders, filters]);

  const pendingOrders = filteredOrders.filter(o => o.status === 'pending' || o.status === 'processing');
  const readyToShipCount = filteredOrders.filter(o => o.status === 'processing').length;

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
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
    if (selectedOrders.length === pendingOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(pendingOrders.map(o => o.id));
    }
  };

  const handleCreateLabel = (order) => {
    window.location.href = createPageUrl('CreateLabel') + `?orderId=${order.id}`;
  };

  const handleBatchCreateLabels = () => {
    const orderIds = selectedOrders.join(',');
    window.location.href = createPageUrl('CreateLabel') + `?orderIds=${orderIds}`;
  };

  const handleBulkStatusChange = (status) => {
    if (selectedOrders.length === 0) return;
    if (confirm(`Move ${selectedOrders.length} order(s) to ${status}?`)) {
      bulkUpdateStatusMutation.mutate({ orderIds: selectedOrders, status });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
            <p className="text-slate-500 mt-1">
              {pendingOrders.length} pending shipment{pendingOrders.length !== 1 ? 's' : ''}
              {readyToShipCount > 0 && (
                <span className="ml-2 text-teal-600 font-medium">
                  • {readyToShipCount} ready to ship
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => syncMagentoMutation.mutate()}
              disabled={syncMagentoMutation.isPending}
              className="border-teal-300 text-teal-700 hover:bg-teal-50"
            >
              <Package className={`w-4 h-4 mr-2 ${syncMagentoMutation.isPending ? 'animate-spin' : ''}`} />
              Sync Magento
            </Button>
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              disabled={isFetching}
              className="border-slate-300"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to={createPageUrl('ManualOrder')}>
              <Button variant="outline" className="border-slate-300">
                <Plus className="w-4 h-4 mr-2" />
                Manual Order
              </Button>
            </Link>
            {selectedOrders.length > 0 && (
              <>
                <Select onValueChange={handleBulkStatusChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Change Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Move to Production</SelectItem>
                    <SelectItem value="hold">Put on Hold</SelectItem>
                    <SelectItem value="cancelled">Cancel Orders</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleBatchCreateLabels}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Tags className="w-4 h-4 mr-2" />
                  Create {selectedOrders.length} Label{selectedOrders.length !== 1 ? 's' : ''}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <OrderFilters 
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </div>

        {/* Select All */}
        {pendingOrders.length > 0 && (
          <div className="flex items-center gap-3 mb-4 px-1">
            <Checkbox 
              checked={selectedOrders.length === pendingOrders.length && pendingOrders.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-slate-600">
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
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No orders found</h3>
            <p className="text-slate-500 mb-6">
              {filters.search || filters.status !== 'all' || filters.priority !== 'all' 
                ? 'Try adjusting your filters'
                : 'Orders from Magento will appear here'}
            </p>
            <Link to={createPageUrl('ManualOrder')}>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Manual Order
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                selected={selectedOrders.includes(order.id)}
                onSelect={handleSelectOrder}
                onCreateLabel={handleCreateLabel}
                showCheckbox={order.status === 'pending' || order.status === 'processing'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}