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
import PrintOrderList from "@/components/orders/PrintOrderList";
import PrioritySuggestion from "@/components/orders/PrioritySuggestion";
import { 
  Plus, 
  RefreshCw, 
  Package, 
  Tags,
  Loader2,
  Printer,
  Upload
} from "lucide-react";

export default function Orders() {
  const queryClient = useQueryClient();
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [aiAssistOrder, setAiAssistOrder] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'Order Received - Awaiting Fulfillment.',
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

  const importCsvMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              order_number: { type: "string" },
              customer_name: { type: "string" },
              customer_email: { type: "string" },
              street1: { type: "string" },
              street2: { type: "string" },
              street3: { type: "string" },
              city: { type: "string" },
              state: { type: "string" },
              country: { type: "string" },
              phone: { type: "string" },
              sku: { type: "string" },
              item_name: { type: "string" },
              quantity: { type: "number" },
              weight: { type: "number" },
              priority: { type: "string" },
              special_instructions: { type: "string" }
            }
          }
        }
      });
      
      if (result.status === 'error') {
        throw new Error(result.details);
      }

      const ordersByNumber = {};
      result.output.forEach(row => {
        if (!ordersByNumber[row.order_number]) {
          ordersByNumber[row.order_number] = {
            order_number: row.order_number,
            source: 'manual',
            customer_name: row.customer_name,
            customer_email: row.customer_email,
            shipping_address: {
              street1: row.street1,
              street2: [row.street2, row.street3].filter(Boolean).join(' '),
              city: row.city,
              state: row.state,
              zip: '',
              country: row.country || 'US',
              phone: row.phone
            },
            items: [],
            priority: row.priority || 'normal',
            special_instructions: row.special_instructions
          };
        }
        
        ordersByNumber[row.order_number].items.push({
          sku: row.sku,
          name: row.item_name,
          quantity: row.quantity,
          weight: row.weight
        });
      });

      const orders = Object.values(ordersByNumber);
      orders.forEach(order => {
        order.total_weight = order.items.reduce((sum, item) => sum + (item.weight * item.quantity || 0), 0);
      });

      await base44.entities.Order.bulkCreate(orders);
      return orders.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShowImportDialog(false);
      alert(`✓ Imported ${count} orders from CSV`);
    },
    onError: (error) => {
      alert(`Failed to import: ${error.message}`);
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
          order.customer_email?.toLowerCase().includes(search) ||
          (order.items && order.items.some(item => item.sku?.toLowerCase().includes(search)));
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

  const pendingOrders = filteredOrders;

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

  const handleAiSuggestionAccept = async (suggestedPriority) => {
    if (aiAssistOrder) {
      await base44.entities.Order.update(aiAssistOrder.id, { priority: suggestedPriority });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setAiAssistOrder(null);
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
              {pendingOrders.length} new order{pendingOrders.length !== 1 ? 's' : ''} awaiting processing
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
            <Button 
              variant="outline" 
              onClick={() => setShowImportDialog(true)}
              className="border-slate-300"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
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

        {/* AI Priority Assistant */}
        {aiAssistOrder && (
          <div className="mb-6">
            <PrioritySuggestion
              order={aiAssistOrder}
              onAccept={handleAiSuggestionAccept}
              onClose={() => setAiAssistOrder(null)}
            />
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
                showCheckbox={order.status === 'pending'}
                onAiAssist={() => setAiAssistOrder(order)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedOrders.length > 0 && (
        <PrintOrderList orders={orders.filter(o => selectedOrders.includes(o.id))} />
      )}

      {showImportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Import Orders from CSV</h2>
            <p className="text-sm text-slate-600 mb-4">
              Upload a CSV file with columns: order_number, customer_name, customer_email, street1, street2, street3, city, state, country, phone, sku, item_name, quantity, weight, priority, special_instructions
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) importCsvMutation.mutate(file);
              }}
              disabled={importCsvMutation.isPending}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowImportDialog(false)}
                disabled={importCsvMutation.isPending}
              >
                Cancel
              </Button>
            </div>
            {importCsvMutation.isPending && (
              <div className="flex items-center justify-center mt-4">
                <Loader2 className="w-5 h-5 animate-spin text-teal-600 mr-2" />
                <span className="text-sm text-slate-600">Processing CSV...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}