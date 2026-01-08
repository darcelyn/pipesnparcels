import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import BoxSelector from "@/components/shipping/BoxSelector";
import RateComparison from "@/components/shipping/RateComparison";
import AddressDisplay from "@/components/shipping/AddressDisplay";
import { 
  Package, 
  Scale, 
  Printer,
  CheckCircle,
  ArrowLeft,
  Loader2,
  AlertTriangle
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
  
  const [weight, setWeight] = useState('');
  const [selectedBox, setSelectedBox] = useState(null);
  const [customDimensions, setCustomDimensions] = useState({ length: '', width: '', height: '' });
  const [selectedRate, setSelectedRate] = useState(null);
  const [rates, setRates] = useState([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [labelCreated, setLabelCreated] = useState(false);
  const [createdShipment, setCreatedShipment] = useState(null);

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
      setWeight(order.total_weight.toString());
    }
  }, [order]);

  const handleGetRates = async () => {
    if (!weight || (!selectedBox && !customDimensions.length)) return;
    
    setIsLoadingRates(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockRates = generateMockRates(
      parseFloat(weight),
      order?.shipping_address
    );
    setRates(mockRates);
    setIsLoadingRates(false);
  };

  useEffect(() => {
    if (weight && (selectedBox || (customDimensions.length && customDimensions.width && customDimensions.height))) {
      handleGetRates();
    }
  }, [weight, selectedBox, customDimensions]);

  const handleCustomDimensionsChange = (field, value) => {
    setCustomDimensions(prev => ({ ...prev, [field]: value }));
    setSelectedBox(null);
  };

  const handleCreateLabel = async () => {
    if (!selectedRate || !order) return;
    
    setIsCreatingLabel(true);
    
    // Simulate label creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const dimensions = selectedBox 
      ? { length: selectedBox.length, width: selectedBox.width, height: selectedBox.height }
      : customDimensions;

    const trackingNumber = `${selectedRate.carrier.toUpperCase()}${Date.now()}`;
    
    const shipmentData = {
      order_id: order.id,
      order_number: order.order_number,
      tracking_number: trackingNumber,
      carrier: selectedRate.carrier,
      service_type: selectedRate.serviceName,
      status: 'label_created',
      ship_date: format(new Date(), 'yyyy-MM-dd'),
      estimated_delivery: format(new Date(Date.now() + selectedRate.transitDays * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      box_type: selectedBox?.name || 'Custom',
      dimensions,
      weight: parseFloat(weight),
      shipping_cost: selectedRate.price,
      label_url: `https://example.com/labels/${trackingNumber}.pdf`,
      customer_name: order.customer_name,
      destination_address: order.shipping_address,
      is_international: order.is_international
    };

    const shipment = await createShipmentMutation.mutateAsync(shipmentData);
    
    // Update order status
    await updateOrderMutation.mutateAsync({
      id: order.id,
      data: { status: 'shipped' }
    });

    setCreatedShipment({ ...shipmentData, id: shipment.id });
    setLabelCreated(true);
    setIsCreatingLabel(false);
  };

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
        <div className="flex items-center gap-4 mb-8">
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
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-2">Items</h4>
                      <div className="space-y-2">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-slate-700">{item.name}</span>
                            <span className="text-slate-500">x{item.quantity}</span>
                          </div>
                        )) || (
                          <p className="text-sm text-slate-400">No items listed</p>
                        )}
                      </div>
                    </div>
                    <AddressDisplay 
                      address={{ name: order.customer_name, ...order.shipping_address }}
                      title="Ship To"
                      compact
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weight Input */}
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Scale className="w-5 h-5 text-teal-600" />
                  Package Weight
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="Enter weight"
                      className="text-lg"
                    />
                  </div>
                  <span className="text-slate-500 font-medium">lbs</span>
                </div>
              </CardContent>
            </Card>

            {/* Box Selection */}
            <BoxSelector
              boxes={boxes}
              selectedBox={selectedBox}
              onSelectBox={setSelectedBox}
              customDimensions={customDimensions}
              onCustomDimensionsChange={handleCustomDimensionsChange}
            />
          </div>

          {/* Right Column - Rates & Action */}
          <div className="space-y-6">
            <RateComparison
              rates={rates}
              selectedRate={selectedRate}
              onSelectRate={setSelectedRate}
              isLoading={isLoadingRates}
            />

            {selectedRate && (
              <Card className="border-teal-200 bg-teal-50">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-700">Shipping Cost</span>
                    <span className="text-2xl font-bold text-slate-900">
                      ${selectedRate.price.toFixed(2)}
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