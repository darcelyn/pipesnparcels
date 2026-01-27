import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  RefreshCw, 
  PackageCheck,
  Loader2,
  Search,
  MoreVertical,
  Package,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";

export default function Staging() {
  const queryClient = useQueryClient();
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    priority: 'all',
    source: 'all'
  });

  const { data: orders = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['staging-orders'],
    queryFn: () => base44.entities.Order.filter({ status: 'staging' })
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
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

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return base44.entities.Order.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staging-orders'] });
    }
  });

  const filteredOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesSearch = 
          order.order_number?.toLowerCase().includes(search) ||
          order.customer_name?.toLowerCase().includes(search) ||
          order.customer_email?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }
      
      if (filters.priority !== 'all' && order.priority !== filters.priority) {
        return false;
      }
      
      if (filters.source !== 'all' && order.source !== filters.source) {
        return false;
      }
      
      return true;
    });
    
    const priorityOrder = { rush: 0, priority: 1, normal: 2 };
    filtered.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.updated_date) - new Date(a.updated_date);
    });
    
    return filtered;
  }, [orders, filters]);

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

  const toggleExpand = (orderId) => {
    setExpandedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleBulkStatusChange = (status) => {
    if (selectedOrders.length === 0) return;
    const statusLabel = status === 'processing' ? 'Ready to Ship' : status === 'production' ? 'Production' : 'Hold';
    if (confirm(`Move ${selectedOrders.length} order(s) to ${statusLabel}?`)) {
      bulkUpdateStatusMutation.mutate({ orderIds: selectedOrders, status });
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      rush: 'bg-red-500/20 text-red-300 border-red-500/30',
      priority: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      normal: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    };
    return colors[priority] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const getSourceColor = (source) => {
    const colors = {
      magento: 'bg-orange-600/20 text-orange-400 border-orange-600/30',
      manual: 'bg-blue-600/20 text-blue-400 border-blue-600/30'
    };
    return colors[source] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">STAGING</h1>
          <p className="text-sm text-gray-400">
            {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} ready for packing
          </p>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex-1 flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search orders..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 bg-[#252525] border-[#3a3a3a] text-white placeholder:text-gray-500 h-9 text-sm"
              />
            </div>
            
            <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
              <SelectTrigger className="w-36 bg-[#252525] border-[#3a3a3a] text-white h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#252525] border-[#3a3a3a]">
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="rush">Rush</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.source} onValueChange={(value) => setFilters(prev => ({ ...prev, source: value }))}>
              <SelectTrigger className="w-36 bg-[#252525] border-[#3a3a3a] text-white h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#252525] border-[#3a3a3a]">
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="magento">Magento</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
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
            {selectedOrders.length > 0 && (
              <Select onValueChange={handleBulkStatusChange}>
                <SelectTrigger className="w-48 bg-[#252525] border-[#3a3a3a] text-white h-9 text-sm">
                  <SelectValue placeholder="Change Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#252525] border-[#3a3a3a]">
                  <SelectItem value="processing">Move to Shipping</SelectItem>
                  <SelectItem value="production">Back to Production</SelectItem>
                  <SelectItem value="hold">Put on Hold</SelectItem>
                </SelectContent>
              </Select>
            )}
            {filteredOrders.length > 0 && (
              <Link to={createPageUrl('PackingStation')}>
                <Button
                  size="sm"
                  className="bg-[#e91e63] hover:bg-[#d81b60] h-9 text-sm font-semibold"
                >
                  <Package className="w-4 h-4 mr-2" />
                  START PACKING
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#252525] rounded-lg border border-[#3a3a3a] overflow-hidden">
          {/* Table Header */}
          <div className="bg-[#2d2d4a] border-b border-[#3a3a3a]">
            <div className="grid grid-cols-[40px_120px_200px_120px_120px_120px_180px_40px] gap-4 px-4 py-3 text-xs font-medium text-gray-400 uppercase">
              <div className="flex items-center">
                <Checkbox
                  checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                  onCheckedChange={handleSelectAll}
                  className="border-gray-500"
                />
              </div>
              <div>ORDER #</div>
              <div>CUSTOMER</div>
              <div>ITEMS</div>
              <div>PRIORITY</div>
              <div>SOURCE</div>
              <div>STAGED DATE</div>
              <div></div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[#3a3a3a]">
            {isLoading ? (
              <div className="py-20 text-center text-gray-500">Loading...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-20 text-center text-gray-500">No orders in staging</div>
            ) : (
              filteredOrders.map((order) => (
                <div key={order.id}>
                  <div className="grid grid-cols-[40px_120px_200px_120px_120px_120px_180px_40px] gap-4 px-4 py-3 text-sm items-center hover:bg-[#2a2a2a] transition-colors">
                    <div className="flex items-center">
                      <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={() => handleSelectOrder(order.id)}
                        className="border-gray-500"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 text-white font-medium">
                      <button
                        onClick={() => toggleExpand(order.id)}
                        className="hover:bg-[#3a3a3a] p-1 rounded"
                      >
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${
                            expandedOrders.includes(order.id) ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                      {order.order_number}
                    </div>
                    
                    <div>
                      <div className="text-white font-medium text-sm">{order.customer_name}</div>
                      <div className="text-gray-400 text-xs">{order.customer_email}</div>
                    </div>
                    
                    <div className="text-gray-300">{order.items?.length || 0} item(s)</div>
                    
                    <div>
                      <Badge className={`${getPriorityColor(order.priority)} border text-xs px-2 py-0.5`}>
                        {order.priority}
                      </Badge>
                    </div>
                    
                    <div>
                      <Badge className={`${getSourceColor(order.source)} border text-xs px-2 py-0.5`}>
                        {order.source}
                      </Badge>
                    </div>
                    
                    <div className="text-gray-300 text-xs">
                      {format(new Date(order.updated_date), 'MMM d, yyyy, h:mm a')}
                    </div>
                    
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#3a3a3a]">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#252525] border-[#3a3a3a]">
                          <DropdownMenuItem
                            onClick={() => updateOrderMutation.mutate({ id: order.id, data: { status: 'processing' } })}
                            className="text-white hover:bg-[#3a3a3a]"
                          >
                            Move to Shipping
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateOrderMutation.mutate({ id: order.id, data: { status: 'production' } })}
                            className="text-white hover:bg-[#3a3a3a]"
                          >
                            Back to Production
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateOrderMutation.mutate({ id: order.id, data: { status: 'hold' } })}
                            className="text-white hover:bg-[#3a3a3a]"
                          >
                            Put on Hold
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {expandedOrders.includes(order.id) && (
                    <div className="bg-[#1f1f1f] border-t border-[#3a3a3a] px-4 py-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Shipping Address</h4>
                          <div className="text-sm text-gray-300 space-y-1">
                            <div>{order.shipping_address?.street1}</div>
                            {order.shipping_address?.street2 && <div>{order.shipping_address.street2}</div>}
                            <div>
                              {order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.zip}
                            </div>
                            <div>{order.shipping_address?.country || 'US'}</div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Order Items & Specs</h4>
                          <div className="space-y-3">
                            {order.items?.map((item, idx) => {
                              const product = products.find(p => p.sku === item.sku);
                              return (
                                <div key={idx} className="bg-[#252525] rounded-lg p-3 border border-[#3a3a3a]">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <div className="text-sm font-medium text-white">{item.name}</div>
                                      <div className="text-xs text-gray-400">SKU: {item.sku}</div>
                                    </div>
                                    <span className="text-xs font-semibold text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded border border-teal-500/30">
                                      x{item.quantity}
                                    </span>
                                  </div>
                                  
                                  {product && (
                                    <div className="mt-2 pt-2 border-t border-[#3a3a3a] space-y-2">
                                      {product.components && product.components.length > 0 && (
                                        <div>
                                          <div className="text-xs font-medium text-gray-400 mb-1">Components:</div>
                                          <div className="text-xs text-gray-300 space-y-0.5">
                                            {product.components.map((comp, i) => (
                                              <div key={i} className="flex justify-between">
                                                <span>• {comp.name}</span>
                                                {comp.quantity && <span className="text-gray-400">x{comp.quantity}</span>}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {product.packing_notes && (
                                        <div>
                                          <div className="text-xs font-medium text-gray-400 mb-1">Packing Notes:</div>
                                          <div className="text-xs text-gray-300">{product.packing_notes}</div>
                                        </div>
                                      )}
                                      
                                      {product.box_type && (
                                        <div>
                                          <div className="text-xs font-medium text-gray-400 mb-1">Box Type:</div>
                                          <div className="text-xs text-gray-300">{product.box_type}</div>
                                        </div>
                                      )}
                                      
                                      {product.related_items && product.related_items.length > 0 && (
                                        <div>
                                          <div className="text-xs font-medium text-gray-400 mb-1">Related Items:</div>
                                          <div className="text-xs text-gray-300">{product.related_items.join(', ')}</div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
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