import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import OrderCard from "@/components/orders/OrderCard";
import OrderFilters from "@/components/orders/OrderFilters";
import { 
  Package, 
  RefreshCw,
  Loader2,
  AlertCircle
} from "lucide-react";

export default function OnHold() {
  const queryClient = useQueryClient();
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    priority: 'all',
    source: 'all'
  });

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: async ({ orderIds, status }) => {
      const updates = orderIds.map(id => 
        base44.entities.Order.update(id, { status })
      );
      return Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders-hold'] });
      setSelectedOrders([]);
    }
  });

  const { data: orders = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['orders-hold'],
    queryFn: () => base44.entities.Order.list('-created_date', 100)
  });

  const holdOrders = useMemo(() => {
    return orders.filter(order => {
      // Only show hold orders
      if (order.status !== 'hold') return false;

      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesSearch = 
          order.order_number?.toLowerCase().includes(search) ||
          order.customer_name?.toLowerCase().includes(search) ||
          order.customer_email?.toLowerCase().includes(search) ||
          (order.items && order.items.some(item => item.sku?.toLowerCase().includes(search)));
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
    if (selectedOrders.length === holdOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(holdOrders.map(o => o.id));
    }
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
            <h1 className="text-2xl font-bold text-slate-900">Orders On Hold</h1>
            <p className="text-slate-500 mt-1">
              {holdOrders.length} order{holdOrders.length !== 1 ? 's' : ''} currently on hold
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              disabled={isFetching}
              className="border-slate-300"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {selectedOrders.length > 0 && (
              <Select onValueChange={handleBulkStatusChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Change Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Move to Pending</SelectItem>
                  <SelectItem value="production">Move to Production</SelectItem>
                  <SelectItem value="cancelled">Cancel Orders</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-900 font-medium">These orders have been placed on hold</p>
            <p className="text-amber-700 text-sm mt-1">
              Review and move them back to pending or other statuses when ready to process.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <OrderFilters 
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            hideStatusFilter={true}
          />
        </div>

        {/* Select All */}
        {holdOrders.length > 0 && (
          <div className="flex items-center gap-3 mb-4 px-1">
            <Checkbox 
              checked={selectedOrders.length === holdOrders.length && holdOrders.length > 0}
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
        ) : holdOrders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No orders on hold</h3>
            <p className="text-slate-500">
              {filters.search || filters.priority !== 'all' || filters.source !== 'all'
                ? 'Try adjusting your filters'
                : 'Orders placed on hold will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {holdOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                selected={selectedOrders.includes(order.id)}
                onSelect={handleSelectOrder}
                showCheckbox={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}