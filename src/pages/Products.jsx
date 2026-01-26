import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  RefreshCw,
  Search,
  ChevronRight,
  MoreVertical,
  Plus,
  X,
  Package
} from "lucide-react";

export default function Products() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedProducts, setExpandedProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showSpecDialog, setShowSpecDialog] = useState(false);
  const [specData, setSpecData] = useState({
    components: [],
    packing_notes: '',
    related_items: []
  });

  const { data: products = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('sku', 500)
  });

  const syncMutation = useMutation({
    mutationFn: async (type) => {
      const response = await base44.functions.invoke('fetchMagentoProducts', { 
        sync_type: type 
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      alert(`Sync complete: ${data.created_count} new, ${data.updated_count} updated`);
    },
    onError: (error) => {
      alert(`Sync failed: ${error.message}`);
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return base44.entities.Product.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowSpecDialog(false);
      setEditingProduct(null);
    }
  });

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !search || 
        p.sku?.toLowerCase().includes(search.toLowerCase()) ||
        p.name?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  const toggleExpand = (productId) => {
    setExpandedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const openSpecDialog = (product) => {
    setEditingProduct(product);
    setSpecData({
      components: product.components || [],
      packing_notes: product.packing_notes || '',
      related_items: product.related_items || []
    });
    setShowSpecDialog(true);
  };

  const addComponent = () => {
    setSpecData(prev => ({
      ...prev,
      components: [...prev.components, { name: '', quantity: 1, notes: '' }]
    }));
  };

  const updateComponent = (index, field, value) => {
    setSpecData(prev => ({
      ...prev,
      components: prev.components.map((comp, i) => 
        i === index ? { ...comp, [field]: value } : comp
      )
    }));
  };

  const removeComponent = (index) => {
    setSpecData(prev => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index)
    }));
  };

  const saveSpecSheet = () => {
    if (!editingProduct) return;
    updateProductMutation.mutate({
      id: editingProduct.id,
      data: specData
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Pipes': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'Fittings': 'bg-green-500/20 text-green-300 border-green-500/30',
      'Valves': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'Tools': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      'Accessories': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      'Other': 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    };
    return colors[category] || colors['Other'];
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">PRODUCTS</h1>
          <p className="text-sm text-gray-400">Manage product catalog and spec sheets</p>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex-1 flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search products by SKU or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-[#252525] border-[#3a3a3a] text-white placeholder:text-gray-500 h-9 text-sm"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40 bg-[#252525] border-[#3a3a3a] text-white h-9 text-sm">
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncMutation.mutate('incremental')}
              disabled={syncMutation.isPending}
              className="bg-transparent border-[#3a3a3a] text-white hover:bg-[#2a2a2a] h-9 text-sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              SYNC MAGENTO
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[#252525] border border-[#3a3a3a] rounded-lg p-4">
            <div className="text-gray-400 text-xs uppercase mb-1">Total Products</div>
            <div className="text-white text-2xl font-bold">{filteredProducts.length}</div>
          </div>
          <div className="bg-[#252525] border border-[#3a3a3a] rounded-lg p-4">
            <div className="text-gray-400 text-xs uppercase mb-1">With Spec Sheets</div>
            <div className="text-white text-2xl font-bold">
              {filteredProducts.filter(p => p.components?.length > 0).length}
            </div>
          </div>
          <div className="bg-[#252525] border border-[#3a3a3a] rounded-lg p-4">
            <div className="text-gray-400 text-xs uppercase mb-1">Low Stock</div>
            <div className="text-white text-2xl font-bold">
              {filteredProducts.filter(p => (p.stock_quantity || 0) < 10).length}
            </div>
          </div>
          <div className="bg-[#252525] border border-[#3a3a3a] rounded-lg p-4">
            <div className="text-gray-400 text-xs uppercase mb-1">Disabled</div>
            <div className="text-white text-2xl font-bold">
              {filteredProducts.filter(p => p.status === 'disabled').length}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#252525] rounded-lg border border-[#3a3a3a] overflow-hidden">
          {/* Table Header */}
          <div className="bg-[#2d2d4a] border-b border-[#3a3a3a]">
            <div className="grid grid-cols-[40px_140px_1fr_140px_100px_100px_100px_100px_40px] gap-4 px-4 py-3 text-xs font-medium text-gray-400 uppercase">
              <div></div>
              <div>SKU</div>
              <div>NAME</div>
              <div>CATEGORY</div>
              <div>PRICE</div>
              <div>STOCK</div>
              <div>WEIGHT</div>
              <div>STATUS</div>
              <div></div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[#3a3a3a]">
            {isLoading ? (
              <div className="py-20 text-center text-gray-500">Loading...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-20 text-center text-gray-500">No products found</div>
            ) : (
              filteredProducts.map((product) => (
                <div key={product.id}>
                  <div className="grid grid-cols-[40px_140px_1fr_140px_100px_100px_100px_100px_40px] gap-4 px-4 py-3 text-sm items-center hover:bg-[#2a2a2a] transition-colors">
                    <div className="flex items-center">
                      <button
                        onClick={() => toggleExpand(product.id)}
                        className="hover:bg-[#3a3a3a] p-1 rounded"
                      >
                        <ChevronRight
                          className={`w-4 h-4 text-gray-400 transition-transform ${
                            expandedProducts.includes(product.id) ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div className="text-white font-medium font-mono text-xs">
                      {product.sku}
                    </div>
                    
                    <div className="text-white">{product.name}</div>
                    
                    <div>
                      <Badge className={`${getCategoryColor(product.category)} border text-xs px-2 py-0.5`}>
                        {product.category}
                      </Badge>
                    </div>
                    
                    <div className="text-gray-300">
                      ${product.price?.toFixed(2) || '0.00'}
                    </div>
                    
                    <div className={`${(product.stock_quantity || 0) < 10 ? 'text-red-400' : 'text-gray-300'}`}>
                      {product.stock_quantity || 0}
                    </div>
                    
                    <div className="text-gray-300">
                      {product.weight || 0} lbs
                    </div>
                    
                    <div>
                      <Badge className={`${product.status === 'enabled' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-gray-500/20 text-gray-300 border-gray-500/30'} border text-xs px-2 py-0.5`}>
                        {product.status}
                      </Badge>
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
                            onClick={() => openSpecDialog(product)}
                            className="text-white hover:bg-[#3a3a3a]"
                          >
                            <Package className="w-4 h-4 mr-2" />
                            Edit Spec Sheet
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateProductMutation.mutate({
                              id: product.id,
                              data: { status: product.status === 'enabled' ? 'disabled' : 'enabled' }
                            })}
                            className="text-white hover:bg-[#3a3a3a]"
                          >
                            {product.status === 'enabled' ? 'Disable' : 'Enable'} Product
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {expandedProducts.includes(product.id) && (
                    <div className="bg-[#1f1f1f] border-t border-[#3a3a3a] px-4 py-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase">Components</h4>
                          {product.components && product.components.length > 0 ? (
                            <div className="space-y-2">
                              {product.components.map((comp, idx) => (
                                <div key={idx} className="text-sm">
                                  <div className="text-white flex items-center gap-2">
                                    <span className="text-gray-400">•</span>
                                    {comp.name} <span className="text-gray-500">(x{comp.quantity})</span>
                                  </div>
                                  {comp.notes && (
                                    <div className="text-gray-400 text-xs ml-4 italic">"{comp.notes}"</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-gray-500 text-sm italic">No components defined</div>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase">Packing Notes</h4>
                          {product.packing_notes ? (
                            <div className="bg-orange-500/10 border border-orange-500/30 rounded p-3 text-orange-300 text-sm">
                              ⚠️ {product.packing_notes}
                            </div>
                          ) : (
                            <div className="text-gray-500 text-sm italic">No packing notes</div>
                          )}

                          {product.related_items && product.related_items.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Related Items</h4>
                              <div className="flex flex-wrap gap-2">
                                {product.related_items.map((sku, idx) => (
                                  <Badge key={idx} className="bg-blue-500/20 text-blue-300 border-blue-500/30 border text-xs">
                                    {sku}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
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

      {/* Edit Spec Sheet Dialog */}
      {showSpecDialog && editingProduct && (
        <Dialog open={showSpecDialog} onOpenChange={setShowSpecDialog}>
          <DialogContent className="max-w-3xl bg-[#252525] border-[#3a3a3a] text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                Edit Spec Sheet - {editingProduct.sku}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 mt-4">
              {/* Components */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-300">Components</label>
                  <Button
                    size="sm"
                    onClick={addComponent}
                    className="bg-[#e91e63] hover:bg-[#d81b60] h-8 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Component
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {specData.components.map((comp, idx) => (
                    <div key={idx} className="bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg p-3">
                      <div className="grid grid-cols-[1fr_80px_40px] gap-2 mb-2">
                        <Input
                          placeholder="Component name"
                          value={comp.name}
                          onChange={(e) => updateComponent(idx, 'name', e.target.value)}
                          className="bg-[#252525] border-[#3a3a3a] text-white h-8 text-sm"
                        />
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={comp.quantity}
                          onChange={(e) => updateComponent(idx, 'quantity', parseInt(e.target.value) || 1)}
                          className="bg-[#252525] border-[#3a3a3a] text-white h-8 text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeComponent(idx)}
                          className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Special notes (optional)"
                        value={comp.notes || ''}
                        onChange={(e) => updateComponent(idx, 'notes', e.target.value)}
                        className="bg-[#252525] border-[#3a3a3a] text-white h-8 text-sm"
                      />
                    </div>
                  ))}
                  
                  {specData.components.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No components added yet
                    </div>
                  )}
                </div>
              </div>

              {/* Packing Notes */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Packing Notes</label>
                <Textarea
                  placeholder="Special packing instructions for this product..."
                  value={specData.packing_notes}
                  onChange={(e) => setSpecData(prev => ({ ...prev, packing_notes: e.target.value }))}
                  className="bg-[#252525] border-[#3a3a3a] text-white min-h-24"
                />
              </div>

              {/* Related Items */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Related Items (comma-separated SKUs)</label>
                <Input
                  placeholder="e.g., PROD-001, PROD-002"
                  value={specData.related_items?.join(', ') || ''}
                  onChange={(e) => setSpecData(prev => ({ 
                    ...prev, 
                    related_items: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))}
                  className="bg-[#252525] border-[#3a3a3a] text-white h-9"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-[#3a3a3a]">
                <Button
                  variant="outline"
                  onClick={() => setShowSpecDialog(false)}
                  className="bg-transparent border-[#3a3a3a] text-white hover:bg-[#3a3a3a]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveSpecSheet}
                  disabled={updateProductMutation.isPending}
                  className="bg-[#e91e63] hover:bg-[#d81b60]"
                >
                  {updateProductMutation.isPending ? 'Saving...' : 'Save Spec Sheet'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}