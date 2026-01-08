import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  Package,
  Plus,
  Trash2,
  Save,
  Loader2,
  Globe
} from "lucide-react";

export default function ManualOrder() {
  const queryClient = useQueryClient();
  const [order, setOrder] = useState({
    order_number: `MAN-${Date.now()}`,
    source: 'manual',
    status: 'pending',
    priority: 'normal',
    customer_name: '',
    customer_email: '',
    shipping_address: {
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US',
      phone: ''
    },
    items: [{ sku: '', name: '', quantity: 1, weight: 0 }],
    total_weight: 0,
    order_value: 0,
    special_instructions: '',
    is_international: false
  });

  const createOrderMutation = useMutation({
    mutationFn: (data) => base44.entities.Order.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      window.location.href = createPageUrl('CreateLabel') + `?orderId=${data.id}`;
    }
  });

  const handleFieldChange = (field, value) => {
    setOrder(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field, value) => {
    setOrder(prev => ({
      ...prev,
      shipping_address: { ...prev.shipping_address, [field]: value },
      is_international: field === 'country' ? value !== 'US' : prev.is_international
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...order.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    const totalWeight = newItems.reduce((sum, item) => 
      sum + (item.weight * item.quantity), 0
    );
    
    setOrder(prev => ({ ...prev, items: newItems, total_weight: totalWeight }));
  };

  const addItem = () => {
    setOrder(prev => ({
      ...prev,
      items: [...prev.items, { sku: '', name: '', quantity: 1, weight: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (order.items.length === 1) return;
    const newItems = order.items.filter((_, i) => i !== index);
    const totalWeight = newItems.reduce((sum, item) => 
      sum + (item.weight * item.quantity), 0
    );
    setOrder(prev => ({ ...prev, items: newItems, total_weight: totalWeight }));
  };

  const handleSubmit = () => {
    createOrderMutation.mutate(order);
  };

  const isValid = order.customer_name && 
    order.shipping_address.street1 && 
    order.shipping_address.city && 
    order.shipping_address.state && 
    order.shipping_address.zip;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => window.location.href = createPageUrl('Orders')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create Manual Order</h1>
            <p className="text-slate-500">Add a shipment that's not from Magento</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Order Info */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-600" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Order Number</Label>
                  <Input
                    value={order.order_number}
                    onChange={(e) => handleFieldChange('order_number', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select 
                    value={order.priority}
                    onValueChange={(value) => handleFieldChange('priority', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="rush">Rush</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Order Value ($)</Label>
                <Input
                  type="number"
                  value={order.order_value}
                  onChange={(e) => handleFieldChange('order_value', parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-teal-600" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Customer Name *</Label>
                  <Input
                    value={order.customer_name}
                    onChange={(e) => handleFieldChange('customer_name', e.target.value)}
                    placeholder="Full name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={order.customer_email}
                    onChange={(e) => handleFieldChange('customer_email', e.target.value)}
                    placeholder="email@example.com"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-600" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Street Address *</Label>
                <Input
                  value={order.shipping_address.street1}
                  onChange={(e) => handleAddressChange('street1', e.target.value)}
                  placeholder="123 Main St"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Apartment, suite, etc.</Label>
                <Input
                  value={order.shipping_address.street2}
                  onChange={(e) => handleAddressChange('street2', e.target.value)}
                  placeholder="Apt 4B"
                  className="mt-1"
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>City *</Label>
                  <Input
                    value={order.shipping_address.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>State *</Label>
                  <Input
                    value={order.shipping_address.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    placeholder="CA"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>ZIP Code *</Label>
                  <Input
                    value={order.shipping_address.zip}
                    onChange={(e) => handleAddressChange('zip', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Country</Label>
                  <Select 
                    value={order.shipping_address.country}
                    onValueChange={(value) => handleAddressChange('country', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="MX">Mexico</SelectItem>
                      <SelectItem value="GB">United Kingdom</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={order.shipping_address.phone}
                    onChange={(e) => handleAddressChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="mt-1"
                  />
                </div>
              </div>
              {order.is_international && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-blue-800 text-sm">
                  <Globe className="w-4 h-4" />
                  International shipping - customs forms may be required
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-600" />
                Items
              </CardTitle>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1 grid md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs">SKU</Label>
                        <Input
                          value={item.sku}
                          onChange={(e) => handleItemChange(index, 'sku', e.target.value)}
                          placeholder="SKU"
                          className="mt-1"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-xs">Product Name</Label>
                        <Input
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          placeholder="Product name"
                          className="mt-1"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Qty</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Weight (lbs)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={item.weight}
                            onChange={(e) => handleItemChange(index, 'weight', parseFloat(e.target.value) || 0)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={order.items.length === 1}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <span className="text-slate-600">Total Weight:</span>
                <span className="font-semibold text-slate-900">{order.total_weight.toFixed(1)} lbs</span>
              </div>
            </CardContent>
          </Card>

          {/* Special Instructions */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Special Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={order.special_instructions}
                onChange={(e) => handleFieldChange('special_instructions', e.target.value)}
                placeholder="Any special handling or delivery instructions..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button 
              variant="outline"
              onClick={() => window.location.href = createPageUrl('Orders')}
            >
              Cancel
            </Button>
            <Button 
              className="bg-teal-600 hover:bg-teal-700"
              onClick={handleSubmit}
              disabled={!isValid || createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create & Ship
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}