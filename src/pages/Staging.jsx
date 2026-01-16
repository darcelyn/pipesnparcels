import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import OrderCard from "@/components/orders/OrderCard";
import OrderFilters from "@/components/orders/OrderFilters";
import PrintOrderList from "@/components/orders/PrintOrderList";
import { 
  RefreshCw, 
  PackageCheck,
  Loader2,
  Printer,
  MoreVertical
} from "lucide-react";

export default function Staging() {
  const queryClient = useQueryClient();
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    priority: 'all',
    source: 'all'
  });

  const { data: orders = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['staging-orders'],
    queryFn: () => base44.entities.Order.filter({ status: 'staging' })
  });

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: async ({ orderIds, status }) => {
      const updates = orderIds.map(id => 
        base44.entities.Order.update(id, { status })
      );
      return Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staging-orders'] });
      setSelectedOrders([]);
    }
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
      // Then by updated date (most recently staged first)
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

  const handleBulkStatusChange = (status) => {
    if (selectedOrders.length === 0) return;
    const statusLabel = status === 'processing' ? 'ready to ship' : status;
    if (confirm(`Move ${selectedOrders.length} order(s) to ${statusLabel}?`)) {
      bulkUpdateStatusMutation.mutate({ orderIds: selectedOrders, status });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <PackageCheck className="w-6 h-6 text-purple-700" />
              </div>
              Staging Area
            </h1>
            <p className="text-slate-500 mt-1">
              {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} ready for shipping
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
              <>
                <Select onValueChange={handleBulkStatusChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Change Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="processing">Move to Shipping</SelectItem>
                    <SelectItem value="production">Back to Production</SelectItem>
                    <SelectItem value="hold">Put on Hold</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  className="border-slate-300"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print List
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
            hideStatusFilter
          />
        </div>

        {/* Select All */}
        {filteredOrders.length > 0 && (
          <div className="flex items-center gap-3 mb-4 px-1">
            <Checkbox 
              checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
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
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <PackageCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No orders in staging</h3>
            <p className="text-slate-500">
              {filters.search || filters.priority !== 'all' 
                ? 'Try adjusting your filters'
                : 'Orders staged for shipping will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                selected={selectedOrders.includes(order.id)}
                onSelect={handleSelectOrder}
                showCheckbox
                showStagedBy
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