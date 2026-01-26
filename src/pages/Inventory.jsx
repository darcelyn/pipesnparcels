import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Loader2,
  Search,
  Plus,
  Minus,
  History
} from "lucide-react";

export default function Inventory() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState('manual_add');
  const [quantityChange, setQuantityChange] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('name')
  });

  const { data: adjustments = [] } = useQuery({
    queryKey: ['stock-adjustments', selectedProduct?.id],
    queryFn: () => selectedProduct 
      ? base44.entities.StockAdjustment.filter({ product_id: selectedProduct.id }, '-created_date', 50)
      : [],
    enabled: !!selectedProduct
  });

  const adjustStockMutation = useMutation({
    mutationFn: async ({ productId, adjustmentData }) => {
      const product = products.find(p => p.id === productId);
      const previousQty = product.stock_quantity || 0;
      const change = adjustmentType === 'manual_add' || adjustmentType === 'found' || adjustmentType === 'recount'
        ? Math.abs(parseFloat(quantityChange))
        : -Math.abs(parseFloat(quantityChange));
      const newQty = Math.max(0, previousQty + change);

      const user = await base44.auth.me();
      
      await base44.entities.StockAdjustment.create({
        product_id: productId,
        sku: product.sku,
        product_name: product.name,
        adjustment_type: adjustmentType,
        quantity_change: change,
        previous_quantity: previousQty,
        new_quantity: newQty,
        reason: adjustmentReason,
        adjusted_by: user.email
      });

      await base44.entities.Product.update(productId, {
        stock_quantity: newQty
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
      setShowAdjustDialog(false);
      setQuantityChange('');
      setAdjustmentReason('');
      setSelectedProduct(null);
    }
  });

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = !searchTerm || 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      
      const stockQty = product.stock_quantity || 0;
      const threshold = product.low_stock_threshold || 10;
      const matchesStock = 
        stockFilter === 'all' ||
        (stockFilter === 'low' && stockQty <= threshold && stockQty > 0) ||
        (stockFilter === 'out' && stockQty === 0) ||
        (stockFilter === 'healthy' && stockQty > threshold);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchTerm, categoryFilter, stockFilter]);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const lowStock = products.filter(p => {
      const qty = p.stock_quantity || 0;
      const threshold = p.low_stock_threshold || 10;
      return qty > 0 && qty <= threshold;
    }).length;
    const outOfStock = products.filter(p => (p.stock_quantity || 0) === 0).length;
    const totalValue = products.reduce((sum, p) => sum + ((p.stock_quantity || 0) * (p.price || 0)), 0);

    return { totalProducts, lowStock, outOfStock, totalValue };
  }, [products]);

  const getStockStatus = (product) => {
    const qty = product.stock_quantity || 0;
    const threshold = product.low_stock_threshold || 10;
    
    if (qty === 0) return { label: 'Out of Stock', color: 'bg-red-500/20 text-red-300 border-red-500/30' };
    if (qty <= threshold) return { label: 'Low Stock', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    return { label: 'In Stock', color: 'bg-green-500/20 text-green-300 border-green-500/30' };
  };

  const handleAdjustStock = (product) => {
    setSelectedProduct(product);
    setShowAdjustDialog(true);
  };

  const handleViewHistory = (product) => {
    setSelectedProduct(product);
    setShowHistoryDialog(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">INVENTORY MANAGEMENT</h1>
          <p className="text-sm text-gray-400">Track stock levels and manage inventory</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-[#252525] border-[#3a3a3a]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-gray-400 uppercase">Total Products</CardTitle>
              <Package className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalProducts}</div>
            </CardContent>
          </Card>

          <Card className="bg-[#252525] border-[#3a3a3a]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-gray-400 uppercase">Low Stock</CardTitle>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.lowStock}</div>
            </CardContent>
          </Card>

          <Card className="bg-[#252525] border-[#3a3a3a]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-gray-400 uppercase">Out of Stock</CardTitle>
              <TrendingDown className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.outOfStock}</div>
            </CardContent>
          </Card>

          <Card className="bg-[#252525] border-[#3a3a3a]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-gray-400 uppercase">Total Value</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${stats.totalValue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-[#252525] border-[#3a3a3a] mb-6">
          <CardContent className="p-4">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search by name or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-[#1f1f1f] border-[#3a3a3a] text-white placeholder:text-gray-500"
                  />
                </div>
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-[#1f1f1f] border-[#3a3a3a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#252525] border-[#3a3a3a]">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Pipes">Pipes</SelectItem>
                  <SelectItem value="Fittings">Fittings</SelectItem>
                  <SelectItem value="Valves">Valves</SelectItem>
                  <SelectItem value="Tools">Tools</SelectItem>
                  <SelectItem value="Accessories">Accessories</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="bg-[#1f1f1f] border-[#3a3a3a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#252525] border-[#3a3a3a]">
                  <SelectItem value="all">All Stock Levels</SelectItem>
                  <SelectItem value="healthy">Healthy Stock</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="out">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Table */}
        <Card className="bg-[#252525] border-[#3a3a3a]">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[#3a3a3a]">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Product</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">SKU</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Category</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Stock</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Alert Level</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3a3a3a]">
                  {filteredProducts.map((product) => {
                    const status = getStockStatus(product);
                    return (
                      <tr key={product.id} className="hover:bg-[#2a2a2a] transition-colors">
                        <td className="px-4 py-3 text-white font-medium">{product.name}</td>
                        <td className="px-4 py-3 text-gray-400 font-mono text-sm">{product.sku}</td>
                        <td className="px-4 py-3 text-gray-400">{product.category}</td>
                        <td className="px-4 py-3 text-white font-semibold">{product.stock_quantity || 0}</td>
                        <td className="px-4 py-3 text-gray-400">{product.low_stock_threshold || 10}</td>
                        <td className="px-4 py-3">
                          <Badge className={`${status.color} border`}>
                            {status.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAdjustStock(product)}
                              className="bg-transparent border-[#3a3a3a] text-white hover:bg-[#2a2a2a] h-8"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Adjust
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewHistory(product)}
                              className="bg-transparent border-[#3a3a3a] text-white hover:bg-[#2a2a2a] h-8"
                            >
                              <History className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No products found matching your filters
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Adjust Stock Dialog */}
        <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
          <DialogContent className="bg-[#252525] border-[#3a3a3a] text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Adjust Stock - {selectedProduct?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label className="text-gray-300">Current Stock</Label>
                <div className="text-2xl font-bold text-white mt-1">{selectedProduct?.stock_quantity || 0}</div>
              </div>

              <div>
                <Label className="text-gray-300">Adjustment Type</Label>
                <Select value={adjustmentType} onValueChange={setAdjustmentType}>
                  <SelectTrigger className="bg-[#1f1f1f] border-[#3a3a3a] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#252525] border-[#3a3a3a]">
                    <SelectItem value="manual_add">Add Stock</SelectItem>
                    <SelectItem value="manual_remove">Remove Stock</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="found">Found</SelectItem>
                    <SelectItem value="recount">Recount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">Quantity</Label>
                <Input
                  type="number"
                  min="0"
                  value={quantityChange}
                  onChange={(e) => setQuantityChange(e.target.value)}
                  placeholder="Enter quantity"
                  className="bg-[#1f1f1f] border-[#3a3a3a] text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300">Reason</Label>
                <Textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Describe the reason for this adjustment..."
                  rows={3}
                  className="bg-[#1f1f1f] border-[#3a3a3a] text-white placeholder:text-gray-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAdjustDialog(false)}
                  className="flex-1 bg-transparent border-[#3a3a3a] text-white hover:bg-[#2a2a2a]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => adjustStockMutation.mutate({ 
                    productId: selectedProduct?.id,
                    adjustmentData: { adjustmentType, quantityChange, adjustmentReason }
                  })}
                  disabled={!quantityChange || adjustStockMutation.isPending}
                  className="flex-1 bg-[#e91e63] hover:bg-[#d81b60]"
                >
                  {adjustStockMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Confirm'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* History Dialog */}
        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent className="bg-[#252525] border-[#3a3a3a] text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Stock History - {selectedProduct?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pt-4">
              {adjustments.map((adj) => (
                <div key={adj.id} className="bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {adj.quantity_change > 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <span className="font-medium text-white">
                        {adj.adjustment_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <span className={`font-semibold ${adj.quantity_change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {adj.quantity_change > 0 ? '+' : ''}{adj.quantity_change}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>Stock: {adj.previous_quantity} → {adj.new_quantity}</div>
                    {adj.reason && <div>Reason: {adj.reason}</div>}
                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-[#3a3a3a]">
                      <span>{adj.adjusted_by}</span>
                      <span>{new Date(adj.created_date).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
              {adjustments.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No stock adjustments recorded yet
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}