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
  Box
} from "lucide-react";
import { format } from "date-fns";

export default function Products() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [syncStatus, setSyncStatus] = useState(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-last_synced')
  });

  const syncProductsMutation = useMutation({
    mutationFn: async () => {
      setSyncStatus('syncing');
      const response = await base44.functions.invoke('fetchMagentoProducts', {});
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSyncStatus('success');
      setTimeout(() => setSyncStatus(null), 5000);
    },
    onError: (error) => {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus(null), 5000);
    }
  });

  const filteredProducts = products.filter(product => 
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0);
  const lowStockCount = products.filter(p => p.stock_quantity < 10).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Products</h1>
            <p className="text-slate-500 mt-1">Manage inventory synced from Magento</p>
          </div>
          <Button
            onClick={() => syncProductsMutation.mutate()}
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
              </>
            )}
          </Button>
        </div>

        {/* Sync Status */}
        {syncStatus === 'success' && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-green-800 font-medium">Products synced successfully!</p>
            </CardContent>
          </Card>
        )}

        {syncStatus === 'error' && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800 font-medium">Failed to sync products. Check your Magento credentials.</p>
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

        {/* Search */}
        <Card className="mb-6 border-slate-200">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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
          <div className="grid gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Product Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-900 text-lg mb-1">
                            {product.name}
                          </h3>
                          <p className="text-sm text-slate-500">SKU: {product.sku}</p>
                        </div>
                        <Badge 
                          className={product.status === 'enabled' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-slate-100 text-slate-800'
                          }
                        >
                          {product.status}
                        </Badge>
                      </div>
                      
                      {product.description && (
                        <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                          {product.description.replace(/<[^>]*>/g, '')}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-700">${product.price?.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Box className="w-4 h-4 text-slate-400" />
                          <span className={`font-medium ${
                            product.stock_quantity < 10 ? 'text-red-600' : 'text-slate-700'
                          }`}>
                            {product.stock_quantity} in stock
                          </span>
                        </div>
                        {product.weight > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500">Weight: {product.weight} lbs</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Last Synced */}
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Last synced</p>
                      <p className="text-sm font-medium text-slate-700">
                        {product.last_synced 
                          ? format(new Date(product.last_synced), 'MMM d, yyyy h:mm a')
                          : 'Never'
                        }
                      </p>
                    </div>
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