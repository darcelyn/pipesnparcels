import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";
import { format, differenceInHours } from 'date-fns';

export default function WIPTracker({ tasks, workstations }) {
  const queryClient = useQueryClient();

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, updates }) => base44.entities.ProductionTask.update(taskId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-tasks'] });
    }
  });

  // Active and blocked tasks
  const activeTasks = useMemo(() => {
    return tasks.filter(t => t.status === 'in_progress');
  }, [tasks]);

  const blockedTasks = useMemo(() => {
    return tasks.filter(t => t.status === 'blocked');
  }, [tasks]);

  // Calculate workstation utilization
  const stationUtilization = useMemo(() => {
    return workstations.map(station => {
      const stationTasks = tasks.filter(t => 
        t.workstation === station.name && t.status === 'in_progress'
      );
      const hoursUsed = stationTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
      const capacity = station.capacity_hours_per_day || 8;
      const utilization = Math.min(100, (hoursUsed / capacity) * 100);

      return {
        station,
        tasks: stationTasks,
        utilization,
        hoursUsed,
        capacity
      };
    });
  }, [tasks, workstations]);

  const handleCompleteTask = (task) => {
    const now = new Date();
    const actualHours = task.actual_start 
      ? differenceInHours(now, new Date(task.actual_start))
      : task.estimated_hours;

    updateTaskMutation.mutate({
      taskId: task.id,
      updates: { 
        status: 'completed',
        actual_end: now.toISOString(),
        actual_hours: actualHours
      }
    });
  };

  const handleBlockTask = (task) => {
    const reason = prompt('Why is this task blocked?');
    if (reason) {
      updateTaskMutation.mutate({
        taskId: task.id,
        updates: { 
          status: 'blocked',
          blocked_reason: reason
        }
      });
    }
  };

  const handleUnblockTask = (task) => {
    updateTaskMutation.mutate({
      taskId: task.id,
      updates: { 
        status: 'in_progress',
        blocked_reason: null
      }
    });
  };

  const getProgressPercentage = (task) => {
    if (task.status === 'completed') return 100;
    if (task.status === 'blocked' || !task.actual_start) return 0;
    
    const elapsed = differenceInHours(new Date(), new Date(task.actual_start));
    const estimated = task.estimated_hours || 1;
    return Math.min(100, (elapsed / estimated) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Workstation Utilization */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Workstation Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stationUtilization.map(({ station, utilization, hoursUsed, capacity }, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-slate-700">{station.name}</span>
                  <span className="text-sm text-slate-600">
                    {hoursUsed.toFixed(1)}h / {capacity}h ({utilization.toFixed(0)}%)
                  </span>
                </div>
                <Progress value={utilization} className="h-2" />
              </div>
            ))}
            {stationUtilization.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">
                No workstations configured. Add workstations in Settings.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Tasks */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Play className="w-5 h-5 text-blue-600" />
            Tasks in Progress ({activeTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeTasks.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              No tasks currently in progress
            </p>
          ) : (
            <div className="space-y-3">
              {activeTasks.map(task => (
                <div key={task.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900">#{task.order_number}</span>
                        {task.priority === 'rush' && (
                          <Badge className="bg-red-100 text-red-800">RUSH</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-700">{task.task_name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Started: {task.actual_start ? format(new Date(task.actual_start), 'MMM d, h:mm a') : 'N/A'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBlockTask(task)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Block
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleCompleteTask(task)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>Progress</span>
                      <span>{getProgressPercentage(task).toFixed(0)}%</span>
                    </div>
                    <Progress value={getProgressPercentage(task)} className="h-2" />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>Workstation: {task.workstation}</span>
                    <span>Est: {task.estimated_hours}h</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blocked Tasks */}
      {blockedTasks.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              Blocked Tasks ({blockedTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {blockedTasks.map(task => (
                <div key={task.id} className="bg-white border border-red-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900">#{task.order_number}</span>
                      </div>
                      <p className="text-sm text-slate-700">{task.task_name}</p>
                      <p className="text-sm text-red-600 mt-2">
                        <strong>Blocked:</strong> {task.blocked_reason || 'No reason provided'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleUnblockTask(task)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Resume
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}