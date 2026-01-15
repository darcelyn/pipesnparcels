import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import OrderFilters from "@/components/orders/OrderFilters";
import PrintProductionList from "@/components/orders/PrintProductionList";
import { 
  RefreshCw, 
  Factory,
  Loader2,
  Printer,
  Package
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
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
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

  const handlePrintList = () => {
    setShowPrintView(true);
    setTimeout(() => {
      window.print();
      setShowPrintView(false);
    }, 100);
  };

  if (showPrintView) {
    return <PrintProductionList selectedItems={selectedItems} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Factory className="w-6 h-6 text-amber-700" />
              </div>
              Production Queue
            </h1>
            <p className="text-slate-500 mt-1">
              {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} in production
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
            {selectedItems.length > 0 && (
              <Button
                onClick={handlePrintList}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Production List ({selectedItems.length})
              </Button>
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

        {/* Orders List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <Factory className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No orders in production</h3>
            <p className="text-slate-500">
              {filters.search || filters.priority !== 'all' 
                ? 'Try adjusting your filters'
                : 'Orders moved to production will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <Card key={order.id} className="border-slate-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-slate-900">
                          Order #{order.order_number}
                        </h3>
                        {order.priority === 'rush' && (
                          <Badge className="bg-red-100 text-red-800">RUSH</Badge>
                        )}
                        {order.priority === 'priority' && (
                          <Badge className="bg-orange-100 text-orange-800">Priority</Badge>
                        )}
                      </div>
                      <p className="text-slate-600">{order.customer_name}</p>
                    </div>
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
                          className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selected 
                              ? 'border-amber-500 bg-amber-50' 
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <Checkbox 
                            checked={selected}
                            onCheckedChange={(checked) => handleSelectItem(order.order_number, order.customer_name, item)}
                            className="mt-1"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="font-medium text-slate-900 mb-1">
                                  {shorthand?.shorthand || item.name}
                                </p>
                                {shorthand?.special_options && (
                                  <p className="text-sm text-amber-700 font-medium mb-1">
                                    {shorthand.special_options}
                                  </p>
                                )}
                                <p className="text-xs text-slate-500 font-mono">{item.sku}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-slate-600">Qty</p>
                                <p className="text-2xl font-bold text-slate-900">{item.quantity}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}