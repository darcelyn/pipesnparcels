import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Edit2, CheckCircle, AlertTriangle } from "lucide-react";

export default function AddressDisplay({ 
  address, 
  title = "Shipping Address",
  validated = null,
  onEdit,
  compact = false
}) {
  if (!address) return null;

  if (compact) {
    return (
      <div className="text-sm">
        <p className="font-medium text-slate-900">{address.name || address.company_name}</p>
        <p className="text-slate-600">{address.street1}</p>
        {address.street2 && <p className="text-slate-600">{address.street2}</p>}
        <p className="text-slate-600">
          {address.city}, {address.state} {address.zip}
        </p>
        {address.country && address.country !== 'US' && (
          <p className="text-slate-600">{address.country}</p>
        )}
      </div>
    );
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-600" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {validated === true && (
              <span className="text-xs text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Verified
              </span>
            )}
            {validated === false && (
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Unverified
              </span>
            )}
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="font-medium text-slate-900">{address.name || address.company_name}</p>
          <p className="text-slate-700 mt-1">{address.street1}</p>
          {address.street2 && <p className="text-slate-700">{address.street2}</p>}
          <p className="text-slate-700">
            {address.city}, {address.state} {address.zip}
          </p>
          {address.country && address.country !== 'US' && (
            <p className="text-slate-700 font-medium">{address.country}</p>
          )}
          {address.phone && (
            <p className="text-slate-500 text-sm mt-2">{address.phone}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}