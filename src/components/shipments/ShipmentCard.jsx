import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/ui/StatusBadge";
import CarrierLogo from "@/components/ui/CarrierLogo";
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MapPin, 
  Calendar, 
  DollarSign,
  Printer,
  ExternalLink,
  Package,
  Trash2
} from "lucide-react";
import { format } from "date-fns";

export default function ShipmentCard({ 
  shipment, 
  onReprint,
  onTrack,
  compact = false
}) {
  if (compact) {
    return (
      <Card className="border-slate-200 hover:shadow-sm transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <CarrierLogo carrier={shipment.carrier} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 text-sm">#{shipment.order_number}</p>
              <p className="text-xs text-slate-500 truncate">{shipment.tracking_number}</p>
            </div>
            <StatusBadge status={shipment.status} size="sm" showIcon={false} />
          </div>
        </CardContent>
      </Card>
    );
  }

  const queryClient = useQueryClient();
  const address = shipment.destination_address || {};

  const deleteShipmentMutation = useMutation({
    mutationFn: async (password) => {
      const response = await base44.functions.invoke('deleteShipment', { shipmentId: shipment.id, password });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Failed to delete shipment');
    }
  });

  const handleDelete = () => {
    const password = prompt('Enter password to delete this shipment:');
    if (password) {
      deleteShipmentMutation.mutate(password);
    }
  };

  return (
    <Card className="border-slate-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <CarrierLogo carrier={shipment.carrier} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-900">
                  #{shipment.order_number || 'N/A'}
                </span>
                <StatusBadge status={shipment.status} size="sm" />
                {shipment.shipment_category && shipment.shipment_category !== 'order' && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full capitalize">
                    {shipment.shipment_category.replace('_', ' ')}
                  </span>
                )}
              </div>
              <span className="text-sm text-slate-500">
                {format(new Date(shipment.created_date), 'MMM d, yyyy')}
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{shipment.customer_name}</p>
                <div className="text-sm text-slate-600 mt-1 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                  <span>
                    {address.city}, {address.state} {address.zip}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-600">{shipment.service_type}</p>
                <p className="text-xs text-slate-500 mt-1 font-mono">{shipment.tracking_number}</p>
                {shipment.category_notes && (
                  <p className="text-xs text-slate-500 mt-1 italic">{shipment.category_notes}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <span className="font-semibold text-slate-900">
                  ${shipment.shipping_cost?.toFixed(2)}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteShipmentMutation.isPending}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onReprint(shipment)}
                >
                  <Printer className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onTrack(shipment)}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}