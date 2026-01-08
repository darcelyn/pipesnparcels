import React from 'react';
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Package, 
  Truck, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Pause
} from "lucide-react";

const statusConfig = {
  pending: { 
    label: "Pending", 
    className: "bg-amber-100 text-amber-800 border-amber-200", 
    icon: Clock 
  },
  processing: { 
    label: "Processing", 
    className: "bg-blue-100 text-blue-800 border-blue-200", 
    icon: Package 
  },
  shipped: { 
    label: "Shipped", 
    className: "bg-indigo-100 text-indigo-800 border-indigo-200", 
    icon: Truck 
  },
  delivered: { 
    label: "Delivered", 
    className: "bg-emerald-100 text-emerald-800 border-emerald-200", 
    icon: CheckCircle 
  },
  hold: { 
    label: "On Hold", 
    className: "bg-slate-100 text-slate-800 border-slate-200", 
    icon: Pause 
  },
  cancelled: { 
    label: "Cancelled", 
    className: "bg-red-100 text-red-800 border-red-200", 
    icon: XCircle 
  },
  label_created: { 
    label: "Label Created", 
    className: "bg-violet-100 text-violet-800 border-violet-200", 
    icon: Package 
  },
  picked_up: { 
    label: "Picked Up", 
    className: "bg-blue-100 text-blue-800 border-blue-200", 
    icon: Package 
  },
  in_transit: { 
    label: "In Transit", 
    className: "bg-indigo-100 text-indigo-800 border-indigo-200", 
    icon: Truck 
  },
  out_for_delivery: { 
    label: "Out for Delivery", 
    className: "bg-teal-100 text-teal-800 border-teal-200", 
    icon: Truck 
  },
  exception: { 
    label: "Exception", 
    className: "bg-orange-100 text-orange-800 border-orange-200", 
    icon: AlertTriangle 
  },
  voided: { 
    label: "Voided", 
    className: "bg-gray-100 text-gray-800 border-gray-200", 
    icon: XCircle 
  },
  priority: { 
    label: "Priority", 
    className: "bg-rose-100 text-rose-800 border-rose-200", 
    icon: AlertTriangle 
  },
  rush: { 
    label: "Rush", 
    className: "bg-red-100 text-red-800 border-red-200", 
    icon: AlertTriangle 
  },
  normal: { 
    label: "Normal", 
    className: "bg-gray-100 text-gray-600 border-gray-200", 
    icon: Package 
  }
};

export default function StatusBadge({ status, showIcon = true, size = "default" }) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    default: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5"
  };

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${sizeClasses[size]} font-medium border inline-flex items-center gap-1.5`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      {config.label}
    </Badge>
  );
}