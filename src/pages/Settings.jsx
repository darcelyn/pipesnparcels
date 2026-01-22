import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Building2, 
  Truck, 
  Box, 
  Printer,
  Save,
  Loader2,
  Plus,
  Trash2,
  Settings as SettingsIcon,
  Package,
  X
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function Settings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('company');
  const [isSaving, setIsSaving] = useState(false);
  
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const result = await base44.entities.ShippingSettings.filter({ setting_key: 'main' });
      return result[0] || null;
    }
  });

  const { data: boxes = [] } = useQuery({
    queryKey: ['boxes'],
    queryFn: () => base44.entities.BoxPreset.list('name')
  });

  const { data: packingConfigs = [] } = useQuery({
    queryKey: ['packingConfigs'],
    queryFn: () => base44.entities.PackingConfig.list('sku')
  });

  const [formData, setFormData] = useState({
    setting_key: 'main',
    return_address: {
      company_name: '',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US',
      phone: ''
    },
    default_carrier: 'cheapest',
    default_box: '',
    auto_print_labels: false,
    default_label_format: 'zpl',
    magento_polling_interval: 15,
    send_tracking_emails: true,
    markup_percentage: 0,
    fedex_account_number: '',
    usps_account_id: '',
    magento_store_url: '',
    magento_two_way_sync: false
  });

  const [newBox, setNewBox] = useState({
    name: '',
    length: '',
    width: '',
    height: '',
    best_for: '',
    is_active: true,
    is_custom: true
  });

  const [newPackingConfig, setNewPackingConfig] = useState({
    sku: '',
    product_name: '',
    components: [],
    notes: ''
  });

  const [componentInput, setComponentInput] = useState('');

  useEffect(() => {
    if (settings) {
      setFormData(prev => ({ ...prev, ...settings }));
    }
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (data) => {
      if (settings?.id) {
        return base44.entities.ShippingSettings.update(settings.id, data);
      } else {
        return base44.entities.ShippingSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });

  const createBoxMutation = useMutation({
    mutationFn: (data) => base44.entities.BoxPreset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boxes'] });
      setNewBox({
        name: '',
        length: '',
        width: '',
        height: '',
        best_for: '',
        is_active: true,
        is_custom: true
      });
    }
  });

  const deleteBoxMutation = useMutation({
    mutationFn: (id) => base44.entities.BoxPreset.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boxes'] });
    }
  });

  const createPackingConfigMutation = useMutation({
    mutationFn: (data) => base44.entities.PackingConfig.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packingConfigs'] });
      setNewPackingConfig({
        sku: '',
        product_name: '',
        components: [],
        notes: ''
      });
      setComponentInput('');
    }
  });

  const deletePackingConfigMutation = useMutation({
    mutationFn: (id) => base44.entities.PackingConfig.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packingConfigs'] });
    }
  });

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      return_address: { ...prev.return_address, [field]: value }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await saveSettingsMutation.mutateAsync(formData);
    setIsSaving(false);
  };

  const handleAddBox = () => {
    if (newBox.name && newBox.length && newBox.width && newBox.height) {
      createBoxMutation.mutate({
        ...newBox,
        length: parseFloat(newBox.length),
        width: parseFloat(newBox.width),
        height: parseFloat(newBox.height)
      });
    }
  };

  const handleAddComponent = () => {
    if (componentInput.trim()) {
      setNewPackingConfig(prev => ({
        ...prev,
        components: [...prev.components, componentInput.trim()]
      }));
      setComponentInput('');
    }
  };

  const handleRemoveComponent = (index) => {
    setNewPackingConfig(prev => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index)
    }));
  };

  const handleAddPackingConfig = () => {
    if (newPackingConfig.sku && newPackingConfig.components.length > 0) {
      createPackingConfigMutation.mutate(newPackingConfig);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-1">Configure your shipping preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-slate-100">
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="carriers">Carriers</TabsTrigger>
            <TabsTrigger value="boxes">Box Presets</TabsTrigger>
            <TabsTrigger value="packing">Packing Configs</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-teal-600" />
                  Return Address
                </CardTitle>
                <CardDescription>
                  This address will appear on all shipping labels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Company Name</Label>
                  <Input
                    value={formData.return_address.company_name}
                    onChange={(e) => handleAddressChange('company_name', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Street Address</Label>
                  <Input
                    value={formData.return_address.street1}
                    onChange={(e) => handleAddressChange('street1', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Suite/Unit</Label>
                  <Input
                    value={formData.return_address.street2}
                    onChange={(e) => handleAddressChange('street2', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input
                      value={formData.return_address.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input
                      value={formData.return_address.state}
                      onChange={(e) => handleAddressChange('state', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>ZIP Code</Label>
                    <Input
                      value={formData.return_address.zip}
                      onChange={(e) => handleAddressChange('zip', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.return_address.phone}
                    onChange={(e) => handleAddressChange('phone', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="carriers">
            <div className="space-y-6">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-teal-600" />
                    FedEx Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Account Number</Label>
                    <Input
                      value={formData.fedex_account_number}
                      onChange={(e) => handleFieldChange('fedex_account_number', e.target.value)}
                      placeholder="Enter your FedEx account number"
                      className="mt-1"
                    />
                  </div>
                  <p className="text-sm text-slate-500">
                    FedEx API credentials are configured in the backend settings
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-teal-600" />
                    USPS Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Account ID</Label>
                    <Input
                      value={formData.usps_account_id}
                      onChange={(e) => handleFieldChange('usps_account_id', e.target.value)}
                      placeholder="Enter your USPS/Stamps.com account ID"
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="boxes">
            <div className="space-y-6">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Box className="w-5 h-5 text-teal-600" />
                    Box Presets
                  </CardTitle>
                  <CardDescription>
                    Manage your box sizes for quick selection
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {boxes.map((box) => (
                      <div 
                        key={box.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{box.name}</p>
                          <p className="text-sm text-slate-500">
                            {box.length}" × {box.width}" × {box.height}"
                            {box.best_for && ` • ${box.best_for}`}
                          </p>
                        </div>
                        {box.is_custom && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => deleteBoxMutation.mutate(box.id)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium text-slate-900 mb-4">Add New Box</h4>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Box Name</Label>
                          <Input
                            value={newBox.name}
                            onChange={(e) => setNewBox(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="My Custom Box"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Best For</Label>
                          <Input
                            value={newBox.best_for}
                            onChange={(e) => setNewBox(prev => ({ ...prev, best_for: e.target.value }))}
                            placeholder="e.g., Small parts"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Length (in)</Label>
                          <Input
                            type="number"
                            value={newBox.length}
                            onChange={(e) => setNewBox(prev => ({ ...prev, length: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Width (in)</Label>
                          <Input
                            type="number"
                            value={newBox.width}
                            onChange={(e) => setNewBox(prev => ({ ...prev, width: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Height (in)</Label>
                          <Input
                            type="number"
                            value={newBox.height}
                            onChange={(e) => setNewBox(prev => ({ ...prev, height: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <Button 
                        onClick={handleAddBox}
                        disabled={createBoxMutation.isPending}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Box
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="packing">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-teal-600" />
                  Packing Configurations
                </CardTitle>
                <CardDescription>
                  Define what components are included with each SKU/part number
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[400px] overflow-y-auto mb-6">
                  {packingConfigs.map((config) => (
                    <div 
                      key={config.id}
                      className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-slate-900">{config.sku}</p>
                          {config.product_name && (
                            <p className="text-sm text-slate-600">{config.product_name}</p>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deletePackingConfigMutation.mutate(config.id)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs font-medium text-slate-500 mb-1">Components:</p>
                        <div className="flex flex-wrap gap-1">
                          {config.components?.map((component, idx) => (
                            <span 
                              key={idx}
                              className="inline-block bg-teal-100 text-teal-900 px-2 py-0.5 rounded text-xs"
                            >
                              {component}
                            </span>
                          ))}
                        </div>
                      </div>
                      {config.notes && (
                        <p className="text-sm text-slate-600 mt-2 italic">{config.notes}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t">
                  <h4 className="font-medium text-slate-900 mb-4">Add New Packing Configuration</h4>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>SKU / Part Number *</Label>
                        <Input
                          value={newPackingConfig.sku}
                          onChange={(e) => setNewPackingConfig(prev => ({ ...prev, sku: e.target.value }))}
                          placeholder="ABC-123"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Product Name</Label>
                        <Input
                          value={newPackingConfig.product_name}
                          onChange={(e) => setNewPackingConfig(prev => ({ ...prev, product_name: e.target.value }))}
                          placeholder="Optional product name"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Components *</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={componentInput}
                          onChange={(e) => setComponentInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddComponent();
                            }
                          }}
                          placeholder="e.g., CAN, HEADER HARDWARE KIT, BOLT"
                        />
                        <Button 
                          onClick={handleAddComponent}
                          variant="outline"
                          type="button"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      {newPackingConfig.components.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {newPackingConfig.components.map((component, idx) => (
                            <span 
                              key={idx}
                              className="inline-flex items-center gap-1 bg-teal-100 text-teal-900 px-3 py-1 rounded-full text-sm"
                            >
                              {component}
                              <button
                                onClick={() => handleRemoveComponent(idx)}
                                className="hover:text-red-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        value={newPackingConfig.notes}
                        onChange={(e) => setNewPackingConfig(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Any special packing instructions..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    <Button 
                      onClick={handleAddPackingConfig}
                      disabled={createPackingConfigMutation.isPending || !newPackingConfig.sku || newPackingConfig.components.length === 0}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Configuration
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <div className="space-y-6">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-teal-600" />
                    Magento Integration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="magento_store_url">Magento Store URL</Label>
                    <Input
                      id="magento_store_url"
                      value={formData.magento_store_url || ''}
                      onChange={(e) => handleFieldChange('magento_store_url', e.target.value)}
                      placeholder="https://your-store.com"
                      className="mt-1"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Your Magento store base URL (e.g., https://example.com)
                    </p>
                  </div>
                  <div>
                    <Label>API Credentials</Label>
                    <p className="text-sm text-slate-500 mb-2">
                      Configure your Magento API key in the app secrets (magento_api_key)
                    </p>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="two_way_sync">Two-Way Sync</Label>
                        <p className="text-sm text-slate-500">
                          Automatically update Magento when orders are modified here
                        </p>
                      </div>
                      <Switch
                        id="two_way_sync"
                        checked={formData.magento_two_way_sync || false}
                        onCheckedChange={(checked) => handleFieldChange('magento_two_way_sync', checked)}
                      />
                    </div>
                    {formData.magento_two_way_sync && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                        <p className="text-sm text-blue-800">
                          <strong>Two-way sync enabled:</strong> Order status changes and tracking info will automatically sync back to Magento.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5 text-teal-600" />
                    Shipping Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label>Default Carrier Selection</Label>
                    <Select 
                      value={formData.default_carrier}
                      onValueChange={(value) => handleFieldChange('default_carrier', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cheapest">Always Cheapest</SelectItem>
                        <SelectItem value="fastest">Always Fastest</SelectItem>
                        <SelectItem value="fedex">Prefer FedEx</SelectItem>
                        <SelectItem value="usps">Prefer USPS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Default Label Format</Label>
                    <Select 
                      value={formData.default_label_format}
                      onValueChange={(value) => handleFieldChange('default_label_format', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zpl">ZPL (Thermal)</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="png">PNG Image</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">Auto-print labels</p>
                    <p className="text-sm text-slate-500">Print labels immediately after creation</p>
                  </div>
                  <Switch 
                    checked={formData.auto_print_labels}
                    onCheckedChange={(checked) => handleFieldChange('auto_print_labels', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">Send tracking emails</p>
                    <p className="text-sm text-slate-500">Email customers when label is created</p>
                  </div>
                  <Switch 
                    checked={formData.send_tracking_emails}
                    onCheckedChange={(checked) => handleFieldChange('send_tracking_emails', checked)}
                  />
                </div>

                <div>
                  <Label>Shipping Markup (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.markup_percentage}
                    onChange={(e) => handleFieldChange('markup_percentage', parseFloat(e.target.value) || 0)}
                    className="mt-1 w-32"
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    Add a percentage to displayed shipping costs
                  </p>
                </div>
              </CardContent>
            </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}