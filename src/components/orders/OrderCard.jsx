import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import StatusBadge from "@/components/ui/StatusBadge";
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MapPin, 
  Package, 
  Scale, 
  Clock, 
  ChevronRight,
  Globe,
  AlertCircle,
  Flag,
  Trash2
} from "lucide-react";
import { format } from "date-fns";

export default function OrderCard({ 
  order, 
  selected, 
  onSelect, 
  onCreateLabel,
  showCheckbox = true 
}) {
  const queryClient = useQueryClient();

  const updatePriorityMutation = useMutation({
    mutationFn: (priority) => base44.entities.Order.update(order.id, { priority }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (password) => {
      const response = await base44.functions.invoke('deleteOrder', { orderId: order.id, password });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Failed to delete order');
    }
  });

  const handleDelete = () => {
    const password = prompt('Enter password to delete this order:');
    if (password) {
      deleteOrderMutation.mutate(password);
    }
  };
  const address = order.shipping_address || {};
  
  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${selected ? 'ring-2 ring-teal-500 bg-teal-50/30' : 'bg-white'}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {showCheckbox && (
            <Checkbox 
              checked={selected}
              onCheckedChange={() => onSelect(order.id)}
              className="mt-1"
            />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-900 text-lg">
                  #{order.order_number}
                </span>
                <StatusBadge status={order.status} size="sm" />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex items-center gap-1 hover:opacity-70 transition-opacity">
                      <StatusBadge status={order.priority} size="sm" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => updatePriorityMutation.mutate('rush')}>
                      <Flag className="w-4 h-4 mr-2 text-red-600" />
                      Rush
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updatePriorityMutation.mutate('priority')}>
                      <Flag className="w-4 h-4 mr-2 text-amber-600" />
                      Priority
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updatePriorityMutation.mutate('normal')}>
                      <Flag className="w-4 h-4 mr-2 text-slate-400" />
                      Normal
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {order.is_international && (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    <Globe className="w-3 h-3" />
                    International
                  </span>
                )}
              </div>
              <span className="text-sm text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {format(new Date(order.created_date), 'MMM d, h:mm a')}
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-900">{order.customer_name}</p>
                <div className="text-sm text-slate-600 mt-1 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                  <span>
                    {address.city}, {address.state} {address.zip}
                    {address.country && address.country !== 'US' && `, ${address.country}`}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1 text-sm text-slate-600">
                  <Package className="w-3.5 h-3.5 text-slate-400" />
                  <span>{order.items?.length || 0} item(s)</span>
                </div>
                {order.total_weight && (
                  <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
                    <Scale className="w-3.5 h-3.5 text-slate-400" />
                    <span>{order.total_weight} lbs</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                {order.special_instructions && (
                  <div className="text-amber-600" title={order.special_instructions}>
                    <AlertCircle className="w-5 h-5" />
                  </div>
                )}
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={handleDelete}
                  disabled={deleteOrderMutation.isPending}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  title="Delete order"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={() => onCreateLabel(order)}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Create Label
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}