import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, startOfWeek, isSameDay, differenceInDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Play, CheckCircle, AlertTriangle } from "lucide-react";

export default function ScheduleTimeline({ tasks, workstations }) {
  const queryClient = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, updates }) => base44.entities.ProductionTask.update(taskId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-tasks'] });
    }
  });

  // Calculate the current week to display
  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date());
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Group tasks by workstation and date
  const scheduleByStation = useMemo(() => {
    const stations = workstations.length > 0 
      ? workstations 
      : [{ name: 'Main Production', type: 'default' }];

    return stations.map(station => {
      const stationTasks = tasks.filter(t => t.workstation === station.name);
      
      const tasksByDay = weekDays.map(day => {
        return stationTasks.filter(task => {
          const taskStart = new Date(task.scheduled_start);
          const taskEnd = new Date(task.scheduled_end);
          return day >= taskStart && day <= taskEnd;
        });
      });

      return {
        station,
        tasksByDay
      };
    });
  }, [tasks, workstations, weekDays]);

  const handleStartTask = (task) => {
    updateTaskMutation.mutate({
      taskId: task.id,
      updates: { 
        status: 'in_progress',
        actual_start: new Date().toISOString()
      }
    });
  };

  const handleCompleteTask = (task) => {
    updateTaskMutation.mutate({
      taskId: task.id,
      updates: { 
        status: 'completed',
        actual_end: new Date().toISOString()
      }
    });
  };

  const getTaskColor = (task) => {
    if (task.status === 'completed') return 'bg-green-100 border-green-300 text-green-800';
    if (task.status === 'in_progress') return 'bg-blue-100 border-blue-300 text-blue-800';
    if (task.status === 'blocked') return 'bg-red-100 border-red-300 text-red-800';
    if (task.priority === 'rush') return 'bg-orange-100 border-orange-300 text-orange-800';
    if (task.priority === 'priority') return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    return 'bg-slate-100 border-slate-300 text-slate-800';
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Production Schedule</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset(weekOffset - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium px-3">
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset(weekOffset + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset(0)}
            >
              Today
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header with days */}
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div className="font-medium text-sm text-slate-600">Workstation</div>
              {weekDays.map((day, idx) => (
                <div
                  key={idx}
                  className={`text-center text-sm font-medium ${
                    isSameDay(day, new Date())
                      ? 'text-blue-600 bg-blue-50 rounded-lg py-1'
                      : 'text-slate-600'
                  }`}
                >
                  <div>{format(day, 'EEE')}</div>
                  <div className="text-xs">{format(day, 'MMM d')}</div>
                </div>
              ))}
            </div>

            {/* Schedule grid */}
            {scheduleByStation.map(({ station, tasksByDay }, stationIdx) => (
              <div key={stationIdx} className="grid grid-cols-8 gap-2 mb-4 border-t pt-2">
                <div className="font-medium text-sm text-slate-700 py-2">
                  {station.name}
                  {!station.is_active && (
                    <Badge variant="outline" className="ml-2 text-xs">Offline</Badge>
                  )}
                </div>
                {tasksByDay.map((dayTasks, dayIdx) => (
                  <div key={dayIdx} className="min-h-[80px] bg-slate-50 rounded-lg p-2 space-y-1">
                    {dayTasks.map(task => (
                      <div
                        key={task.id}
                        className={`text-xs p-2 rounded border ${getTaskColor(task)} cursor-pointer hover:shadow-md transition-shadow`}
                        title={`${task.task_name} - ${task.estimated_hours}h`}
                      >
                        <div className="font-medium truncate">#{task.order_number}</div>
                        <div className="text-xs opacity-75 truncate">{task.task_name}</div>
                        <div className="flex items-center gap-1 mt-1">
                          {task.status === 'scheduled' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartTask(task);
                              }}
                              className="hover:opacity-70"
                              title="Start task"
                            >
                              <Play className="w-3 h-3" />
                            </button>
                          )}
                          {task.status === 'in_progress' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCompleteTask(task);
                              }}
                              className="hover:opacity-70"
                              title="Complete task"
                            >
                              <CheckCircle className="w-3 h-3" />
                            </button>
                          )}
                          {task.status === 'blocked' && (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          <span className="text-xs">{task.estimated_hours}h</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
            <span>Rush</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span>Blocked</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}