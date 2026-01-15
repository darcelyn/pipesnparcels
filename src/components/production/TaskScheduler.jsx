import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from 'date-fns';

export default function TaskScheduler({ orders, workstations, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    order_id: '',
    task_name: '',
    workstation: workstations[0]?.name || 'Main Production',
    priority: 'normal',
    scheduled_start: new Date(),
    estimated_hours: 8,
    materials_ready: true,
    notes: ''
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data) => {
      const selectedOrder = orders.find(o => o.id === data.order_id);
      const scheduledEnd = new Date(data.scheduled_start);
      scheduledEnd.setHours(scheduledEnd.getHours() + data.estimated_hours);

      const task = {
        ...data,
        order_number: selectedOrder?.order_number || 'N/A',
        scheduled_start: data.scheduled_start.toISOString(),
        scheduled_end: scheduledEnd.toISOString(),
        status: 'scheduled'
      };

      await base44.entities.ProductionTask.create(task);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-tasks'] });
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.task_name) {
      alert('Please enter a task name');
      return;
    }
    createTaskMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Schedule Production Task</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Order Selection */}
          <div>
            <Label>Order (Optional)</Label>
            <Select
              value={formData.order_id}
              onValueChange={(value) => {
                const order = orders.find(o => o.id === value);
                setFormData({
                  ...formData,
                  order_id: value,
                  task_name: order ? `${order.customer_name} - Order #${order.order_number}` : '',
                  priority: order?.priority || 'normal'
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No order (custom task)</SelectItem>
                {orders.map(order => (
                  <SelectItem key={order.id} value={order.id}>
                    #{order.order_number} - {order.customer_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task Name */}
          <div>
            <Label>Task Name *</Label>
            <Input
              value={formData.task_name}
              onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
              placeholder="e.g., Build 5 units for Order #123"
            />
          </div>

          {/* Workstation */}
          <div>
            <Label>Workstation</Label>
            <Select
              value={formData.workstation}
              onValueChange={(value) => setFormData({ ...formData, workstation: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {workstations.length > 0 ? (
                  workstations.map(station => (
                    <SelectItem key={station.id} value={station.name}>
                      {station.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="Main Production">Main Production</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div>
            <Label>Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rush">Rush</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Scheduled Start */}
          <div>
            <Label>Scheduled Start</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {format(formData.scheduled_start, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.scheduled_start}
                  onSelect={(date) => date && setFormData({ ...formData, scheduled_start: date })}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Estimated Hours */}
          <div>
            <Label>Estimated Hours</Label>
            <Input
              type="number"
              min="0.5"
              step="0.5"
              value={formData.estimated_hours}
              onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) })}
            />
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special instructions or requirements"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createTaskMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}