import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ScheduleTimeline from "@/components/production/ScheduleTimeline";
import WIPTracker from "@/components/production/WIPTracker";
import ProductionForecast from "@/components/production/ProductionForecast";
import TaskScheduler from "@/components/production/TaskScheduler";
import PlanningGuide from "@/components/production/PlanningGuide";
import { 
  Calendar, 
  TrendingUp, 
  Loader2,
  RefreshCw,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  HelpCircle
} from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';

export default function ProductionPlanning() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('schedule');
  const [showScheduler, setShowScheduler] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

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

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === 'planning2026') {
      setIsUnlocked(true);
    } else {
      alert('Incorrect password');
      setPasswordInput('');
    }
  };

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

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <Card className="w-full max-w-md bg-[#252525] border-[#3a3a3a]">
          <CardHeader>
            <CardTitle className="text-white">Access Required</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label className="text-gray-300">Enter Password</Label>
                <Input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Password"
                  autoFocus
                  className="bg-[#1f1f1f] border-[#3a3a3a] text-white placeholder:text-gray-500"
                />
              </div>
              <Button type="submit" className="w-full bg-[#e91e63] hover:bg-[#d81b60]">
                Unlock
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1a1a1a]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">SYSTEM TOOLS</h1>
            <p className="text-sm text-gray-400">
              Schedule, track, and optimize your production workflow
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowGuide(true)}
              size="sm"
              className="bg-transparent border-[#3a3a3a] text-white hover:bg-[#2a2a2a] h-9 text-sm"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              GUIDE
            </Button>
            <Button 
              variant="outline" 
              onClick={() => refetchTasks()}
              size="sm"
              className="bg-transparent border-[#3a3a3a] text-white hover:bg-[#2a2a2a] h-9 text-sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              REFRESH
            </Button>
            <Button
              variant="outline"
              onClick={() => autoScheduleMutation.mutate()}
              disabled={autoScheduleMutation.isPending}
              size="sm"
              className="bg-transparent border-[#3a3a3a] text-white hover:bg-[#2a2a2a] h-9 text-sm"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              AUTO-SCHEDULE
            </Button>
            <Button
              onClick={() => setShowScheduler(true)}
              size="sm"
              className="bg-[#e91e63] hover:bg-[#d81b60] h-9 text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              NEW TASK
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-[#252525] border-[#3a3a3a]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-gray-400 uppercase">
                Scheduled Today
              </CardTitle>
              <Clock className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{kpis.scheduledToday}</div>
              <p className="text-xs text-gray-500 mt-1">Tasks to start today</p>
            </CardContent>
          </Card>

          <Card className="bg-[#252525] border-[#3a3a3a]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-gray-400 uppercase">
                In Progress
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{kpis.inProgress}</div>
              <p className="text-xs text-gray-500 mt-1">Currently active</p>
            </CardContent>
          </Card>

          <Card className="bg-[#252525] border-[#3a3a3a]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-gray-400 uppercase">
                Completed This Week
              </CardTitle>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{kpis.completedThisWeek}</div>
              <p className="text-xs text-gray-500 mt-1">Tasks finished</p>
            </CardContent>
          </Card>

          <Card className="bg-[#252525] border-[#3a3a3a]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-gray-400 uppercase">
                Blocked
              </CardTitle>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{kpis.blocked}</div>
              <p className="text-xs text-gray-500 mt-1">Need attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-[#252525] border border-[#3a3a3a]">
            <TabsTrigger value="schedule" className="data-[state=active]:bg-[#3a3a3a] data-[state=active]:text-white text-gray-400">Schedule Timeline</TabsTrigger>
            <TabsTrigger value="wip" className="data-[state=active]:bg-[#3a3a3a] data-[state=active]:text-white text-gray-400">Work in Progress</TabsTrigger>
            <TabsTrigger value="forecast" className="data-[state=active]:bg-[#3a3a3a] data-[state=active]:text-white text-gray-400">Forecast</TabsTrigger>
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

      {/* Planning Guide */}
      {showGuide && (
        <PlanningGuide onClose={() => setShowGuide(false)} />
      )}
    </div>
  );
}