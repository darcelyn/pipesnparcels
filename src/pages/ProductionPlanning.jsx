import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import ScheduleTimeline from "@/components/production/ScheduleTimeline";
import WIPTracker from "@/components/production/WIPTracker";
import ProductionForecast from "@/components/production/ProductionForecast";
import TaskScheduler from "@/components/production/TaskScheduler";
import { 
  Calendar, 
  TrendingUp, 
  Loader2,
  RefreshCw,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';

export default function ProductionPlanning() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('schedule');
  const [showScheduler, setShowScheduler] = useState(false);

  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['production-tasks'],
    queryFn: () => base44.entities.ProductionTask.list('-scheduled_start', 200)
  });

  const { data: workstations = [], isLoading: stationsLoading } = useQuery({
    queryKey: ['workstations'],
    queryFn: () => base44.entities.WorkStation.list()
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['production-orders'],
    queryFn: () => base44.entities.Order.filter({ status: 'production' })
  });

  const isLoading = tasksLoading || stationsLoading;

  // Auto-schedule function
  const autoScheduleMutation = useMutation({
    mutationFn: async () => {
      // Get unscheduled orders
      const unscheduledOrders = orders.filter(order => 
        !tasks.some(task => task.order_id === order.id)
      );

      if (unscheduledOrders.length === 0) {
        return { message: 'No new orders to schedule' };
      }

      // Sort by priority
      const priorityOrder = { rush: 0, priority: 1, normal: 2 };
      unscheduledOrders.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      // Create tasks for each order
      const newTasks = [];
      let currentTime = new Date();
      
      for (const order of unscheduledOrders) {
        const itemsCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 1;
        const estimatedHours = Math.max(1, itemsCount * 0.5); // 0.5 hours per item
        
        // Find least busy workstation
        const workstation = workstations.length > 0 
          ? workstations[Math.floor(Math.random() * workstations.length)]
          : null;

        const task = {
          order_id: order.id,
          order_number: order.order_number,
          task_name: `${order.customer_name} - ${itemsCount} items`,
          workstation: workstation?.name || 'Main Production',
          status: 'scheduled',
          priority: order.priority,
          scheduled_start: currentTime.toISOString(),
          scheduled_end: addDays(currentTime, Math.ceil(estimatedHours / 8)).toISOString(),
          estimated_hours: estimatedHours,
          materials_ready: true
        };

        newTasks.push(task);
        currentTime = addDays(currentTime, Math.ceil(estimatedHours / 8));
      }

      await base44.entities.ProductionTask.bulkCreate(newTasks);
      return { message: `Scheduled ${newTasks.length} new tasks` };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['production-tasks'] });
      alert(result.message);
    }
  });

  // Calculate KPIs
  const kpis = useMemo(() => {
    const today = new Date();
    const scheduledToday = tasks.filter(t => {
      const start = new Date(t.scheduled_start);
      return start.toDateString() === today.toDateString() && t.status === 'scheduled';
    });

    const inProgress = tasks.filter(t => t.status === 'in_progress');
    const blocked = tasks.filter(t => t.status === 'blocked');
    const completedThisWeek = tasks.filter(t => {
      if (t.status !== 'completed' || !t.actual_end) return false;
      const end = new Date(t.actual_end);
      const weekStart = startOfWeek(today);
      const weekEnd = endOfWeek(today);
      return end >= weekStart && end <= weekEnd;
    });

    return {
      scheduledToday: scheduledToday.length,
      inProgress: inProgress.length,
      blocked: blocked.length,
      completedThisWeek: completedThisWeek.length
    };
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-700" />
              </div>
              Production Planning
            </h1>
            <p className="text-slate-500 mt-1">
              Schedule, track, and optimize your production workflow
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => refetchTasks()}
              className="border-slate-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => autoScheduleMutation.mutate()}
              disabled={autoScheduleMutation.isPending}
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Auto-Schedule
            </Button>
            <Button
              onClick={() => setShowScheduler(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Scheduled Today
              </CardTitle>
              <Clock className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{kpis.scheduledToday}</div>
              <p className="text-xs text-slate-500 mt-1">Tasks to start today</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                In Progress
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{kpis.inProgress}</div>
              <p className="text-xs text-slate-500 mt-1">Currently active</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Completed This Week
              </CardTitle>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{kpis.completedThisWeek}</div>
              <p className="text-xs text-slate-500 mt-1">Tasks finished</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Blocked
              </CardTitle>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{kpis.blocked}</div>
              <p className="text-xs text-slate-500 mt-1">Need attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="schedule">Schedule Timeline</TabsTrigger>
            <TabsTrigger value="wip">Work in Progress</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            <ScheduleTimeline tasks={tasks} workstations={workstations} />
          </TabsContent>

          <TabsContent value="wip">
            <WIPTracker tasks={tasks} workstations={workstations} />
          </TabsContent>

          <TabsContent value="forecast">
            <ProductionForecast tasks={tasks} orders={orders} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Task Scheduler Modal */}
      {showScheduler && (
        <TaskScheduler
          orders={orders}
          workstations={workstations}
          onClose={() => setShowScheduler(false)}
        />
      )}
    </div>
  );
}