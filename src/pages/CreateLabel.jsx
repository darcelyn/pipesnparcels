import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import AddressDisplay from "@/components/shipping/AddressDisplay";
import PackingList from "@/components/orders/PackingList";
import { 
  Package, 
  Scale, 
  Printer,
  CheckCircle,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  FileText
} from "lucide-react";
import { format } from "date-fns";

// Mock shipping rates for demo purposes
const generateMockRates = (weight, destination) => {
  const baseRates = [
    { id: 'fedex-ground', carrier: 'fedex', serviceName: 'FedEx Ground', transitDays: 5, basePrice: 8.99 },
    { id: 'fedex-home', carrier: 'fedex', serviceName: 'FedEx Home Delivery', transitDays: 4, basePrice: 11.99 },
    { id: 'fedex-express', carrier: 'fedex', serviceName: 'FedEx Express Saver', transitDays: 3, basePrice: 18.99 },
    { id: 'fedex-2day', carrier: 'fedex', serviceName: 'FedEx 2Day', transitDays: 2, basePrice: 24.99 },
    { id: 'fedex-overnight', carrier: 'fedex', serviceName: 'FedEx Priority Overnight', transitDays: 1, basePrice: 45.99 },
    { id: 'usps-ground', carrier: 'usps', serviceName: 'USPS Ground Advantage', transitDays: 5, basePrice: 7.49 },
    { id: 'usps-priority', carrier: 'usps', serviceName: 'USPS Priority Mail', transitDays: 3, basePrice: 9.99 },
    { id: 'usps-express', carrier: 'usps', serviceName: 'USPS Priority Mail Express', transitDays: 2, basePrice: 28.99 },
  ];
  
  return baseRates.map(rate => ({
    ...rate,
    price: rate.basePrice + (weight * 0.45) + (Math.random() * 2)
  })).sort((a, b) => a.price - b.price);
};

export default function CreateLabel() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId');
  
  const [weightLbs, setWeightLbs] = useState('');
  const [weightOz, setWeightOz] = useState('');
  const [shipFrom, setShipFrom] = useState('default');
  const [dimensions, setDimensions] = useState({ length: '', width: '', height: '' });
  const [packageType, setPackageType] = useState('package');
  const [selectedService, setSelectedService] = useState('');
  const [confirmationType, setConfirmationType] = useState('none');
  const [insurance, setInsurance] = useState('none');
  const [customInsuranceAmount, setCustomInsuranceAmount] = useState('');
  const [rates, setRates] = useState([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [labelCreated, setLabelCreated] = useState(false);
  const [createdShipment, setCreatedShipment] = useState(null);
  const [showPackingList, setShowPackingList] = useState(false);
  const [shipmentCategory, setShipmentCategory] = useState(orderId ? 'order' : 'other');
  const [categoryNotes, setCategoryNotes] = useState('');

  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const orders = await base44.entities.Order.filter({ id: orderId });
      return orders[0] || null;
    },
    enabled: !!orderId
  });

  const { data: boxes = [] } = useQuery({
    queryKey: ['boxes'],
    queryFn: () => base44.entities.BoxPreset.filter({ is_active: true })
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const result = await base44.entities.ShippingSettings.list();
      return result[0] || {
        return_address: {
          company_name: "FedEx Test Sender",
          street1: "1043 North Easy Street",
          street2: "",
          city: "Southaven",
          state: "MS",
          zip: "38671",
          country: "US",
          phone: "9012981272"
        }
      };
    }
  });

  const createShipmentMutation = useMutation({
    mutationFn: (data) => base44.entities.Shipment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  useEffect(() => {
    if (order?.total_weight) {
      // Magento exports weight in oz
      const totalOz = order.total_weight;
      const lbs = Math.floor(totalOz / 16);
      const oz = Math.round(totalOz % 16);
      setWeightLbs(lbs.toString());
      setWeightOz(oz.toString());
    }
  }, [order]);

  useEffect(() => {
    // Auto-populate insurance for orders $500+
    if (order?.order_value && order.order_value >= 500) {
      setInsurance('custom');
      setCustomInsuranceAmount(order.order_value.toFixed(2));
    }
  }, [order?.order_value]);

  const getTotalWeight = () => {
    const lbs = parseFloat(weightLbs) || 0;
    const oz = parseFloat(weightOz) || 0;
    return lbs + (oz / 16);
  };

  const handleGetRates = async () => {
    const totalWeight = getTotalWeight();
    if (!totalWeight || !dimensions.length || !dimensions.width || !dimensions.height) return;
    
    setIsLoadingRates(true);
    
    const mockRates = generateMockRates(totalWeight, order?.shipping_address);
    setRates(mockRates);
    setIsLoadingRates(false);
  };

  useEffect(() => {
    const totalWeight = getTotalWeight();
    if (totalWeight && dimensions.length && dimensions.width && dimensions.height) {
      handleGetRates();
    }
  }, [weightLbs, weightOz, dimensions]);

  const handleCreateLabel = async () => {
    if (!selectedService || !settings?.return_address) return;
    
    if (!settings.return_address) {
      alert('Please configure return address in Settings first');
      return;
    }

    setIsCreatingLabel(true);
    
    try {
      const selectedRate = rates.find(r => r.id === selectedService);
      if (!selectedRate) throw new Error('Selected service not found');

      const shipmentDimensions = {
        length: parseFloat(dimensions.length),
        width: parseFloat(dimensions.width),
        height: parseFloat(dimensions.height)
      };

      const serviceTypeMap = {
        'FedEx Ground': 'FEDEX_GROUND',
        'FedEx Home Delivery': 'GROUND_HOME_DELIVERY',
        'FedEx Express Saver': 'FEDEX_EXPRESS_SAVER',
        'FedEx 2Day': 'FEDEX_2_DAY',
        'FedEx Priority Overnight': 'PRIORITY_OVERNIGHT',
        'FedEx Standard Overnight': 'STANDARD_OVERNIGHT'
      };

      const fedexServiceType = serviceTypeMap[selectedRate.serviceName] || 'FEDEX_GROUND';

      // Step 1: Validate shipment with FedEx
      const validationResponse = await base44.functions.invoke('validateShipment', {
        service_type: fedexServiceType,
        weight: getTotalWeight(),
        dimensions: shipmentDimensions,
        ship_to_address: order ? {
          name: order.customer_name,
          ...order.shipping_address
        } : null,
        ship_from_address: settings.return_address
      });

      if (!validationResponse.data.validated) {
        alert(`Validation Failed: ${validationResponse.data.error}\n\nPlease check the shipping details and try again.`);
        setIsCreatingLabel(false);
        return;
      }

      const response = await base44.functions.invoke('createFedExLabel', {
        order_id: order?.id,
        service_type: fedexServiceType,
        weight: getTotalWeight(),
        dimensions: shipmentDimensions,
        box_type: packageType,
        ship_to_address: order ? {
          name: order.customer_name,
          ...order.shipping_address
        } : null,
        ship_from_address: settings.return_address,
        shipment_category: shipmentCategory,
        category_notes: categoryNotes,
        confirmation_type: confirmationType,
        insurance: insurance === 'custom' ? customInsuranceAmount : insurance
      });

      if (response.data.error) {
        console.error('Full error response:', response.data);
        alert(`Error: ${response.data.error}\n${response.data.details || ''}`);
        return;
      }

      setCreatedShipment({
        tracking_number: response.data.tracking_number,
        label_url: response.data.label_url,
        carrier: 'fedex',
        service_type: selectedRate.serviceName,
        shipping_cost: selectedRate.price,
        estimated_delivery: format(new Date(Date.now() + selectedRate.transitDays * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
      });
      
      setLabelCreated(true);
    } catch (error) {
      console.error('Label creation error:', error);
      alert(`Failed to create label: ${error.message}`);
      setIsCreatingLabel(false);
    }
  };

  const handlePrintPackingList = () => {
    setShowPackingList(true);
    setTimeout(() => {
      window.print();
      setShowPackingList(false);
    }, 100);
  };

  if (showPackingList && order) {
    return <PackingList order={order} />;
  }

  if (orderLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!order && orderId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Order not found</h2>
          <Button onClick={() => window.location.href = createPageUrl('Orders')}>
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  if (labelCreated && createdShipment) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Label Created!</h1>
            <p className="text-slate-600">
              Tracking: <span className="font-mono font-medium">{createdShipment.tracking_number}</span>
            </p>
          </div>

          <Card className="border-slate-200 mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-500">Carrier</p>
                  <p className="font-medium text-slate-900 capitalize">{createdShipment.carrier}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Service</p>
                  <p className="font-medium text-slate-900">{createdShipment.service_type}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Cost</p>
                  <p className="font-medium text-slate-900">${createdShipment.shipping_cost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Est. Delivery</p>
                  <p className="font-medium text-slate-900">
                    {format(new Date(createdShipment.estimated_delivery), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => window.location.href = createPageUrl('Orders')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
            <Button 
              className="flex-1 bg-teal-600 hover:bg-teal-700"
              onClick={() => window.open(createdShipment.label_url, '_blank')}
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Label
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => window.location.href = createPageUrl('Orders')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Create Shipping Label</h1>
              {order && (
                <p className="text-slate-500">Order #{order.order_number}</p>
              )}
            </div>
          </div>
          {order && (
            <Button
              variant="outline"
              onClick={handlePrintPackingList}
              className="border-slate-300"
            >
              <FileText className="w-4 h-4 mr-2" />
              Print Packing List
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details & Box Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            {order && (
              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="w-5 h-5 text-teal-600" />
                    Order Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-3">Items to Pack</h4>
                      <div className="space-y-2">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-slate-900">{item.name}</span>
                              <span className="text-sm font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                                Qty: {item.quantity}
                              </span>
                            </div>
                            <div className="flex gap-4 text-xs text-slate-500">
                              {item.sku && <span>SKU: {item.sku}</span>}
                              {item.weight && <span>Weight: {item.weight} oz each</span>}
                            </div>
                          </div>
                        )) || (
                          <p className="text-sm text-slate-400">No items listed</p>
                        )}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <AddressDisplay 
                      address={{ name: order.customer_name, ...order.shipping_address }}
                      title="Ship To"
                      compact
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Configure Shipment */}
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Configure Shipment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Shipment Category */}
                <div>
                  <Label>Shipment Type</Label>
                  <Select value={shipmentCategory} onValueChange={setShipmentCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order">Order Fulfillment</SelectItem>
                      <SelectItem value="custom_part">Custom Part</SelectItem>
                      <SelectItem value="sample">Sample</SelectItem>
                      <SelectItem value="return">Return</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {shipmentCategory !== 'order' && (
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={categoryNotes}
                      onChange={(e) => setCategoryNotes(e.target.value)}
                      placeholder="Describe the shipment purpose..."
                      rows={2}
                    />
                  </div>
                )}

                <Separator />

                {/* Ship From */}
                <div>
                  <Label>Ship From</Label>
                  <Select value={shipFrom} onValueChange={setShipFrom}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">
                        {settings?.return_address?.company_name || 'Default Address'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Weight */}
                <div>
                  <Label>Weight</Label>
                  <div className="flex gap-2 items-center">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        value={weightLbs}
                        onChange={(e) => setWeightLbs(e.target.value)}
                        placeholder="0"
                        className="w-20"
                      />
                      <span className="text-sm text-slate-500">lbs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="15"
                        value={weightOz}
                        onChange={(e) => setWeightOz(e.target.value)}
                        placeholder="0"
                        className="w-20"
                      />
                      <span className="text-sm text-slate-500">oz</span>
                    </div>
                    <Button variant="outline" size="icon" className="ml-auto">
                      <Scale className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Service */}
                <div>
                  <Label>Service</Label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service..." />
                    </SelectTrigger>
                    <SelectContent>
                      {rates.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Enter weight and dimensions to see rates
                        </SelectItem>
                      ) : (
                        rates.map((rate) => (
                          <SelectItem key={rate.id} value={rate.id}>
                            {rate.serviceName} - ${rate.price.toFixed(2)} ({rate.transitDays} days)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Package */}
                <div>
                  <Label>Package</Label>
                  <Select value={packageType} onValueChange={setPackageType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="package">Package</SelectItem>
                      <SelectItem value="envelope">Envelope</SelectItem>
                      <SelectItem value="pak">Pak</SelectItem>
                      <SelectItem value="tube">Tube</SelectItem>
                      {boxes.map(box => (
                        <SelectItem key={box.id} value={box.name}>
                          {box.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Size */}
                <div>
                  <Label>Size (in)</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={dimensions.length}
                        onChange={(e) => setDimensions(prev => ({ ...prev, length: e.target.value }))}
                        placeholder="L"
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={dimensions.width}
                        onChange={(e) => setDimensions(prev => ({ ...prev, width: e.target.value }))}
                        placeholder="W"
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={dimensions.height}
                        onChange={(e) => setDimensions(prev => ({ ...prev, height: e.target.value }))}
                        placeholder="H"
                      />
                    </div>
                  </div>
                </div>

                {/* Confirmation */}
                <div>
                  <Label>Confirmation</Label>
                  <Select value={confirmationType} onValueChange={setConfirmationType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="signature">Signature</SelectItem>
                      <SelectItem value="adult_signature">Adult Signature</SelectItem>
                      <SelectItem value="direct_signature">Direct Signature</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Insurance */}
                <div>
                  <Label>Insurance</Label>
                  <Select value={insurance} onValueChange={setInsurance}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="100">$100</SelectItem>
                      <SelectItem value="200">$200</SelectItem>
                      <SelectItem value="500">$500</SelectItem>
                      <SelectItem value="1000">$1,000</SelectItem>
                      <SelectItem value="custom">Custom Amount</SelectItem>
                    </SelectContent>
                  </Select>
                  {insurance === 'custom' && (
                    <div className="mt-2">
                      <Label>Insurance Amount</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={customInsuranceAmount}
                        onChange={(e) => setCustomInsuranceAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="mt-1"
                      />
                    </div>
                  )}
                  {insurance !== 'none' && (
                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <span>ℹ️</span> Protect high value orders with insurance
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Action */}
          <div className="space-y-6">
            {selectedService && rates.find(r => r.id === selectedService) && (
              <Card className="border-teal-200 bg-teal-50">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-700">Shipping Cost</span>
                    <span className="text-2xl font-bold text-slate-900">
                      ${rates.find(r => r.id === selectedService)?.price.toFixed(2)}
                    </span>
                  </div>
                  <Button 
                    className="w-full bg-teal-600 hover:bg-teal-700 h-12 text-lg"
                    onClick={handleCreateLabel}
                    disabled={isCreatingLabel}
                  >
                    {isCreatingLabel ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Creating Label...
                      </>
                    ) : (
                      <>
                        <Printer className="w-5 h-5 mr-2" />
                        Create Label
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}