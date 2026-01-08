import React from 'react';
import { Truck, Package } from "lucide-react";

export default function CarrierLogo({ carrier, size = "default" }) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    default: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base"
  };

  const carriers = {
    fedex: {
      bg: "bg-gradient-to-br from-purple-600 to-orange-500",
      text: "FX",
      label: "FedEx"
    },
    usps: {
      bg: "bg-gradient-to-br from-blue-600 to-red-500",
      text: "US",
      label: "USPS"
    }
  };

  const config = carriers[carrier?.toLowerCase()] || carriers.fedex;

  return (
    <div 
      className={`${sizeClasses[size]} ${config.bg} rounded-lg flex items-center justify-center text-white font-bold shadow-sm`}
      title={config.label}
    >
      {config.text}
    </div>
  );
}