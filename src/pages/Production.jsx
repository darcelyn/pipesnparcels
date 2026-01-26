import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import PrintProductionList from "@/components/orders/PrintProductionList";
import { 
  RefreshCw, 
  Factory,
  Loader2,
  Printer,
  Package,
  MoreVertical,
  Search
} from "lucide-react";

export default function Production() {
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState([]);
  const [showPrintView, setShowPrintView] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    priority: 'all',
    source: 'all'
  });

  const { data: orders = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['production-orders'],
    queryFn: () => base44.entities.Order.filter({ status: 'production' })
  });

  const { data: shorthandMap = {} } = useQuery({
    queryKey: ['product-shorthand'],
    queryFn: async () => {
      const data = await base44.entities.ProductShorthand.list();
      return data.reduce((acc, item) => {
        acc[item.sku] = item;
        return acc;
      }, {});
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
      const user = await base44.auth.me();
      return base44.entities.Order.update(orderId, { 
        status,
        ...(status === 'staging' ? { staged_by: user.email } : {})
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
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
      // Then by created date (oldest first - FIFO)
      return new Date(a.created_date) - new Date(b.created_date);
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

  const handleSelectItem = (orderNumber, customerName, item) => {
    const itemKey = `${orderNumber}-${item.sku}`;
    setSelectedItems(prev => {
      const exists = prev.find(i => `${i.order_number}-${i.sku}` === itemKey);
      if (exists) {
        return prev.filter(i => `${i.order_number}-${i.sku}` !== itemKey);
      } else {
        const shorthand = shorthandMap[item.sku];
        return [...prev, {
          order_number: orderNumber,
          customer_name: customerName,
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          shorthand: shorthand?.shorthand || '',
          special_options: shorthand?.special_options || ''
        }];
      }
    });
  };

  const isItemSelected = (orderNumber, sku) => {
    return selectedItems.some(i => i.order_number === orderNumber && i.sku === sku);
  };

  const handlePrintList = async () => {
    // Email the production list
    try {
      await base44.functions.invoke('emailProductionList', { items: selectedItems });
    } catch (error) {
      console.error('Failed to email production list:', error);
    }
    
    setShowPrintView(true);
    setTimeout(() => {
      window.print();
      setShowPrintView(false);
    }, 100);
  };

  if (showPrintView) {
    return <PrintProductionList selectedItems={selectedItems} />;
  }

  const getPriorityColor = (priority) => {
    const colors = {
      rush: 'bg-red-500/20 text-red-300 border-red-500/30',
      priority: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      normal: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    };
    return colors[priority] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">PRODUCTION</h1>
          <p className="text-sm text-gray-400">
            {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} in production queue
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
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 bg-[#252525] border-[#3a3a3a] text-white placeholder:text-gray-500 h-9 text-sm"
              />
            </div>
            
            <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
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

            <Select value={filters.source} onValueChange={(value) => handleFilterChange('source', value)}>
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
            {selectedItems.length > 0 && (
              <Button
                size="sm"
                onClick={handlePrintList}
                className="bg-[#e91e63] hover:bg-[#d81b60] h-9 text-sm font-semibold"
              >
                <Printer className="w-4 h-4 mr-2" />
                PRINT LIST ({selectedItems.length})
              </Button>
            )}
          </div>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <Factory className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No orders in production</h3>
            <p className="text-gray-400">
              {filters.search || filters.priority !== 'all' 
                ? 'Try adjusting your filters'
                : 'Orders moved to production will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-[#252525] border border-[#3a3a3a] rounded-lg p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-white">
                        Order #{order.order_number}
                      </h3>
                      <Badge className={`${getPriorityColor(order.priority)} border text-xs px-2 py-0.5`}>
                        {order.priority}
                      </Badge>
                    </div>
                    <p className="text-gray-400 text-sm">{order.customer_name}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#3a3a3a]">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#252525] border-[#3a3a3a]">
                      <DropdownMenuItem 
                        onClick={() => updateOrderMutation.mutate({ orderId: order.id, status: 'staging' })}
                        className="text-white hover:bg-[#3a3a3a]"
                      >
                        Move to Staging
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => updateOrderMutation.mutate({ orderId: order.id, status: 'pending' })}
                        className="text-white hover:bg-[#3a3a3a]"
                      >
                        Back to Pending
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => updateOrderMutation.mutate({ orderId: order.id, status: 'hold' })}
                        className="text-white hover:bg-[#3a3a3a]"
                      >
                        Put on Hold
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  {order.items?.map((item, idx) => {
                    const shorthand = shorthandMap[item.sku];
                    const selected = isItemSelected(order.order_number, item.sku);
                    
                    return (
                      <div
                        key={idx}
                        onClick={(e) => {
                          if (e.target.tagName !== 'BUTTON') {
                            handleSelectItem(order.order_number, order.customer_name, item);
                          }
                        }}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          selected 
                            ? 'border-[#e91e63] bg-[#e91e63]/10' 
                            : 'border-[#3a3a3a] hover:border-[#4a4a4a] bg-[#1f1f1f]'
                        }`}
                      >
                        <Checkbox 
                          checked={selected}
                          onCheckedChange={(checked) => handleSelectItem(order.order_number, order.customer_name, item)}
                          className="mt-1 border-gray-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="font-medium text-white mb-1">
                                {item.name}
                              </p>
                              {item.options && (
                                <p className="text-sm text-gray-400 mb-1">
                                  {item.options}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 font-mono">{item.sku}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium text-gray-400 uppercase">Qty</p>
                              <p className="text-xl font-bold text-white">{item.quantity}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}