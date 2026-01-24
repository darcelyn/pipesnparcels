import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  RefreshCw, 
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Box,
  ChevronDown,
  Edit,
  X
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

export default function Products() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [syncStatus, setSyncStatus] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({ weight: '', box_type: '', category: '' });
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-last_synced')
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditingProduct(null);
      setEditForm({ weight: '', box_type: '' });
    }
  });

  const syncProductsMutation = useMutation({
    mutationFn: async ({ incremental = true }) => {
      setSyncStatus('syncing');
      const response = await base44.functions.invoke('fetchMagentoProducts', { incremental });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSyncStatus({
        type: 'success',
        message: `${data.sync_type === 'incremental' ? 'Incremental' : 'Full'} sync: ${data.new_count} new, ${data.updated_count} updated`
      });
      setTimeout(() => setSyncStatus(null), 5000);
    },
    onError: (error) => {
      setSyncStatus({ type: 'error', message: error.message });
      setTimeout(() => setSyncStatus(null), 5000);
    }
  });

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Pipes', 'Fittings', 'Valves', 'Tools', 'Accessories', 'Other'];
  const productsByCategory = categories.reduce((acc, category) => {
    acc[category] = filteredProducts.filter(p => p.category === category);
    return acc;
  }, {});

  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0);
  const lowStockCount = products.filter(p => p.stock_quantity < 10).length;

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setEditForm({
      weight: product.weight || '',
      box_type: product.box_type || '',
      category: product.category || 'Other'
    });
  };

  const handleSaveEdit = () => {
    if (editingProduct) {
      updateProductMutation.mutate({
        id: editingProduct.id,
        data: {
          weight: parseFloat(editForm.weight) || 0,
          box_type: editForm.box_type,
          category: editForm.category
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Products</h1>
            <p className="text-slate-500 mt-1">Manage inventory synced from Magento</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={syncProductsMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {syncProductsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync from Magento
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => syncProductsMutation.mutate({ incremental: true })}>
                Quick Sync (Updates Only)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => syncProductsMutation.mutate({ incremental: false })}>
                Full Sync (All Products)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Sync Status */}
        {syncStatus?.type === 'success' && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-green-800 font-medium">{syncStatus.message}</p>
            </CardContent>
          </Card>
        )}

        {syncStatus?.type === 'error' && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800 font-medium">Failed to sync: {syncStatus.message}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Products</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{products.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Inventory Value</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">${totalValue.toFixed(0)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Low Stock Items</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{lowStockCount}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Box className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <Card className="mb-6 border-slate-200">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {products.length === 0 ? 'No Products Yet' : 'No Results Found'}
              </h3>
              <p className="text-slate-500 mb-6">
                {products.length === 0 
                  ? 'Click "Sync from Magento" to import your products'
                  : 'Try adjusting your search terms'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {categories.map(category => {
              const categoryProducts = productsByCategory[category] || [];
              if (categoryProducts.length === 0) return null;
              
              return (
                <div key={category}>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                    {category}
                    <Badge variant="outline" className="text-sm">{categoryProducts.length}</Badge>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categoryProducts.map((product) => (
                      <Card key={product.id} className="border-slate-200 hover:shadow-lg transition-all hover:-translate-y-1">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <Badge 
                              className={product.status === 'enabled' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-slate-100 text-slate-600'
                              }
                            >
                              {product.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditProduct(product)}
                              className="h-7 w-7 -mt-1 -mr-1"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          <h3 className="font-semibold text-slate-900 mb-1 line-clamp-2 min-h-[2.5rem]">
                            {product.name}
                          </h3>
                          <p className="text-xs text-slate-500 mb-3">SKU: {product.sku}</p>

                          {product.description && (
                            <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                              {product.description.replace(/<[^>]*>/g, '')}
                            </p>
                          )}

                          <div className="space-y-2 pt-3 border-t border-slate-100">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-500">Price</span>
                              <span className="font-bold text-slate-900">${product.price?.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-500">Stock</span>
                              <span className={`font-medium ${
                                product.stock_quantity < 10 ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {product.stock_quantity}
                              </span>
                            </div>
                            {product.weight > 0 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Weight</span>
                                <span className="font-medium text-slate-700">{product.weight} lbs</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit Product Dialog */}
        <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Product - {editingProduct?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pipes">Pipes</SelectItem>
                    <SelectItem value="Fittings">Fittings</SelectItem>
                    <SelectItem value="Valves">Valves</SelectItem>
                    <SelectItem value="Tools">Tools</SelectItem>
                    <SelectItem value="Accessories">Accessories</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="weight">Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  value={editForm.weight}
                  onChange={(e) => setEditForm(prev => ({ ...prev, weight: e.target.value }))}
                  placeholder="Enter weight"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="box_type">Box Type</Label>
                <Select
                  value={editForm.box_type}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, box_type: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select box type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LONG">LONG</SelectItem>
                    <SelectItem value="MAIN">MAIN</SelectItem>
                    <SelectItem value="XLFULL">XLFULL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingProduct(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={updateProductMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {updateProductMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}