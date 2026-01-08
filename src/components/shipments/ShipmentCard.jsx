import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/ui/StatusBadge";
import CarrierLogo from "@/components/ui/CarrierLogo";
import { 
  MapPin, 
  Calendar, 
  DollarSign,
  Printer,
  ExternalLink,
  Package
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

  const address = shipment.destination_address || {};

  return (
    <Card className="border-slate-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <CarrierLogo carrier={shipment.carrier} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-900">
                  #{shipment.order_number}
                </span>
                <StatusBadge status={shipment.status} size="sm" />
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
              </div>

              <div className="flex items-center justify-end gap-2">
                <span className="font-semibold text-slate-900">
                  ${shipment.shipping_cost?.toFixed(2)}
                </span>
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