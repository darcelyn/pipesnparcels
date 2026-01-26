import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Package,
  Printer,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  X
} from "lucide-react";
import { format } from "date-fns";

export default function PackingStation() {
  const queryClient = useQueryClient();
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  const [checkedItems, setCheckedItems] = useState({});
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [issueNote, setIssueNote] = useState('');
  const [showPackingSlip, setShowPackingSlip] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['staging-orders'],
    queryFn: () => base44.entities.Order.filter({ status: 'staging' })
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('sku', 500)
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return base44.entities.Order.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staging-orders'] });
      setCheckedItems({});
      // Auto-advance to next order
      if (currentOrderIndex < sortedOrders.length - 1) {
        setCurrentOrderIndex(prev => prev + 1);
      }
    }
  });

  const sortedOrders = useMemo(() => {
    const priorityOrder = { rush: 0, priority: 1, normal: 2 };
    return [...orders].sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.created_date) - new Date(b.created_date);
    });
  }, [orders]);

  const currentOrder = sortedOrders[currentOrderIndex];

  const productMap = useMemo(() => {
    return products.reduce((acc, product) => {
      acc[product.sku] = product;
      return acc;
    }, {});
  }, [products]);

  const packingData = useMemo(() => {
    if (!currentOrder) return [];
    
    return currentOrder.items?.map(item => {
      const product = productMap[item.sku];
      return {
        ...item,
        components: product?.components || [],
        packing_notes: product?.packing_notes || ''
      };
    }) || [];
  }, [currentOrder, productMap]);

  const handleToggleItem = (key) => {
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleFlagIssue = () => {
    if (!currentOrder) return;
    updateOrderMutation.mutate({
      id: currentOrder.id,
      data: { 
        status: 'hold',
        special_instructions: issueNote 
      }
    });
    setShowIssueDialog(false);
    setIssueNote('');
  };

  const handleComplete = () => {
    if (!currentOrder) return;
    if (confirm('Mark this order as packed and ready to ship?')) {
      updateOrderMutation.mutate({
        id: currentOrder.id,
        data: { status: 'processing' }
      });
    }
  };

  const handleSkip = () => {
    if (currentOrderIndex < sortedOrders.length - 1) {
      setCurrentOrderIndex(prev => prev + 1);
      setCheckedItems({});
    }
  };

  const handlePrintPackingSlip = () => {
    setShowPackingSlip(true);
    setTimeout(() => {
      window.print();
      setShowPackingSlip(false);
    }, 100);
  };

  if (showPackingSlip && currentOrder) {
    return (
      <div className="print-content bg-white p-8 max-w-4xl mx-auto">
        <div className="border-2 border-black">
          {/* Header */}
          <div className="bg-black text-white p-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">PIPES & PARCELS</h1>
              <p className="text-sm">Packing Slip</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">Order #{currentOrder.order_number}</p>
              <p className="text-sm">{format(new Date(), 'MMM d, yyyy')}</p>
            </div>
          </div>

          {/* Ship To */}
          <div className="p-4 border-b-2 border-black">
            <h3 className="font-bold text-sm mb-2 uppercase">Ship To:</h3>
            <p className="font-bold">{currentOrder.customer_name}</p>
            <p>{currentOrder.shipping_address?.street1}</p>
            {currentOrder.shipping_address?.street2 && <p>{currentOrder.shipping_address.street2}</p>}
            <p>
              {currentOrder.shipping_address?.city}, {currentOrder.shipping_address?.state} {currentOrder.shipping_address?.zip}
            </p>
            <p>{currentOrder.shipping_address?.country || 'US'}</p>
          </div>

          {/* Items to Pack */}
          <div className="p-4 border-b-2 border-black">
            <h3 className="font-bold text-sm mb-4 uppercase">Items to Pack</h3>
            {packingData.map((item, idx) => (
              <div key={idx} className="mb-6 pb-4 border-b border-gray-300 last:border-b-0">
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-2xl">☐</span>
                  <div className="flex-1">
                    <p className="font-bold text-lg">{item.name}</p>
                    <p className="text-sm text-gray-600">SKU: {item.sku} | Qty: {item.quantity}</p>
                  </div>
                </div>

                {item.components && item.components.length > 0 && (
                  <div className="ml-8 space-y-2">
                    <p className="font-semibold text-sm">Components per unit:</p>
                    {item.components.map((comp, compIdx) => (
                      <div key={compIdx} className="flex items-start gap-2">
                        <span className="text-lg">☐</span>
                        <div className="flex-1">
                          <p className="text-sm">
                            {comp.name} <span className="text-gray-600">x{comp.quantity * item.quantity}</span>
                          </p>
                          {comp.notes && (
                            <p className="text-xs text-gray-600 italic ml-4">"{comp.notes}"</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {item.packing_notes && (
                  <div className="ml-8 mt-3 bg-yellow-50 border-l-4 border-yellow-400 p-3">
                    <p className="text-sm font-bold">⚠️ PACKING NOTE:</p>
                    <p className="text-sm">{item.packing_notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Verification */}
          <div className="p-4 flex justify-between">
            <div>
              <p className="text-sm font-bold mb-2">PACKER VERIFICATION</p>
              <p className="text-sm">Signature: _________________________</p>
            </div>
            <div>
              <p className="text-sm">Date: _____________</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (sortedOrders.length === 0) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">All Done!</h2>
          <p className="text-gray-400 mb-6">No orders in staging queue</p>
          <Button
            onClick={() => window.location.href = '/Staging'}
            className="bg-[#e91e63] hover:bg-[#d81b60]"
          >
            Back to Staging
          </Button>
        </div>
      </div>
    );
  }

  if (!currentOrder) return null;

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
      {/* Top Bar */}
      <div className="bg-[#252525] border-b border-[#3a3a3a] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Package className="w-6 h-6 text-[#e91e63]" />
            <div>
              <h1 className="text-xl font-bold text-white">Packing Station</h1>
              <p className="text-sm text-gray-400">
                Order {currentOrderIndex + 1} of {sortedOrders.length}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/Staging'}
            className="bg-transparent border-[#3a3a3a] text-white hover:bg-[#2a2a2a]"
          >
            <X className="w-4 h-4 mr-2" />
            Exit
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Order Header */}
        <div className="bg-[#252525] border border-[#3a3a3a] rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white">
                  Order #{currentOrder.order_number}
                </h2>
                <Badge className={`${getPriorityColor(currentOrder.priority)} border text-sm px-3 py-1`}>
                  {currentOrder.priority}
                </Badge>
              </div>
              <p className="text-gray-400">{currentOrder.customer_name}</p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-[#1f1f1f] border border-[#3a3a3a] rounded p-4">
            <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Ship To</h4>
            <div className="text-sm text-gray-300 space-y-1">
              <div>{currentOrder.shipping_address?.street1}</div>
              {currentOrder.shipping_address?.street2 && <div>{currentOrder.shipping_address.street2}</div>}
              <div>
                {currentOrder.shipping_address?.city}, {currentOrder.shipping_address?.state} {currentOrder.shipping_address?.zip}
              </div>
            </div>
          </div>
        </div>

        {/* Packing Checklist */}
        <div className="space-y-4 mb-6">
          {packingData.map((item, idx) => (
            <div key={idx} className="bg-[#252525] border border-[#3a3a3a] rounded-lg p-6">
              {/* Main Item */}
              <div className="flex items-start gap-3 mb-4">
                <Checkbox
                  checked={checkedItems[`item-${idx}`] || false}
                  onCheckedChange={() => handleToggleItem(`item-${idx}`)}
                  className="mt-1 border-gray-500"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    SKU: {item.sku} | Quantity: {item.quantity}
                  </p>
                </div>
              </div>

              {/* Components */}
              {item.components && item.components.length > 0 && (
                <div className="ml-8 space-y-3 mb-4">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase">Components</h4>
                  {item.components.map((comp, compIdx) => (
                    <div key={compIdx} className="flex items-start gap-3 bg-[#1f1f1f] border border-[#3a3a3a] rounded p-3">
                      <Checkbox
                        checked={checkedItems[`comp-${idx}-${compIdx}`] || false}
                        onCheckedChange={() => handleToggleItem(`comp-${idx}-${compIdx}`)}
                        className="mt-0.5 border-gray-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm">{comp.name}</span>
                          <span className="text-gray-400 text-sm">x{comp.quantity * item.quantity}</span>
                        </div>
                        {comp.notes && (
                          <p className="text-xs text-gray-400 italic mt-1">"{comp.notes}"</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Packing Notes */}
              {item.packing_notes && (
                <div className="ml-8 bg-orange-500/10 border border-orange-500/30 rounded p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-orange-300 font-semibold text-sm mb-1">PACKING NOTE</p>
                      <p className="text-orange-400 text-sm">{item.packing_notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Bar */}
        <div className="bg-[#252525] border border-[#3a3a3a] rounded-lg p-6 flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrintPackingSlip}
            className="bg-transparent border-[#3a3a3a] text-white hover:bg-[#2a2a2a]"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Packing Slip
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowIssueDialog(true)}
              className="bg-transparent border-[#3a3a3a] text-white hover:bg-[#2a2a2a]"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Flag Issue
            </Button>
            
            {sortedOrders.length > 1 && (
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={currentOrderIndex >= sortedOrders.length - 1}
                className="bg-transparent border-[#3a3a3a] text-white hover:bg-[#2a2a2a]"
              >
                Skip for Now
              </Button>
            )}

            <Button
              onClick={handleComplete}
              disabled={updateOrderMutation.isPending}
              className="bg-[#e91e63] hover:bg-[#d81b60] font-semibold"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Complete & Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Flag Issue Dialog */}
      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <DialogContent className="bg-[#252525] border-[#3a3a3a] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Flag Issue</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-gray-400">
              Describe the issue with this order. It will be moved to "On Hold" for review.
            </p>
            <Textarea
              placeholder="e.g., Missing hardware bag, damaged item, incorrect quantity..."
              value={issueNote}
              onChange={(e) => setIssueNote(e.target.value)}
              className="bg-[#1f1f1f] border-[#3a3a3a] text-white min-h-32"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowIssueDialog(false);
                  setIssueNote('');
                }}
                className="bg-transparent border-[#3a3a3a] text-white hover:bg-[#3a3a3a]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleFlagIssue}
                disabled={!issueNote.trim() || updateOrderMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Put on Hold
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}