import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp, Clock, Package } from "lucide-react";
import { format, addDays, startOfDay, differenceInDays } from 'date-fns';

export default function ProductionForecast({ tasks, orders }) {
  // Historical completion data (last 7 days)
  const historicalData = useMemo(() => {
    const days = 7;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = addDays(startOfDay(new Date()), -i);
      const completed = tasks.filter(t => {
        if (t.status !== 'completed' || !t.actual_end) return false;
        const endDate = startOfDay(new Date(t.actual_end));
        return endDate.getTime() === date.getTime();
      });

      data.push({
        date: format(date, 'MMM dd'),
        completed: completed.length,
        hours: completed.reduce((sum, t) => sum + (t.actual_hours || t.estimated_hours || 0), 0)
      });
    }
    
    return data;
  }, [tasks]);

  // Forecast next 7 days
  const forecastData = useMemo(() => {
    const scheduledTasks = tasks.filter(t => t.status === 'scheduled');
    const avgCompletionRate = historicalData.reduce((sum, d) => sum + d.completed, 0) / historicalData.length;
    
    const data = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(startOfDay(new Date()), i + 1);
      const scheduled = scheduledTasks.filter(t => {
        const taskDate = startOfDay(new Date(t.scheduled_end));
        return taskDate.getTime() === date.getTime();
      });

      data.push({
        date: format(date, 'MMM dd'),
        scheduled: scheduled.length,
        forecast: Math.round(avgCompletionRate)
      });
    }
    
    return data;
  }, [tasks, historicalData]);

  // Capacity analysis
  const capacityAnalysis = useMemo(() => {
    const totalScheduled = tasks.filter(t => t.status === 'scheduled').length;
    const totalInProgress = tasks.filter(t => t.status === 'in_progress').length;
    const avgDailyCompletion = historicalData.reduce((sum, d) => sum + d.completed, 0) / historicalData.length;
    const estimatedDaysToComplete = avgDailyCompletion > 0 
      ? Math.ceil(totalScheduled / avgDailyCompletion) 
      : 0;

    return {
      totalScheduled,
      totalInProgress,
      avgDailyCompletion: avgDailyCompletion.toFixed(1),
      estimatedDaysToComplete,
      projectedCompletionDate: estimatedDaysToComplete > 0 
        ? format(addDays(new Date(), estimatedDaysToComplete), 'MMM dd, yyyy')
        : 'N/A'
    };
  }, [tasks, historicalData]);

  // Bottleneck analysis
  const bottlenecks = useMemo(() => {
    const avgActualHours = tasks
      .filter(t => t.status === 'completed' && t.actual_hours)
      .reduce((sum, t) => sum + t.actual_hours, 0) / 
      tasks.filter(t => t.status === 'completed' && t.actual_hours).length || 0;

    const avgEstimatedHours = tasks
      .filter(t => t.status === 'completed' && t.estimated_hours)
      .reduce((sum, t) => sum + t.estimated_hours, 0) / 
      tasks.filter(t => t.status === 'completed' && t.estimated_hours).length || 0;

    const variance = avgActualHours - avgEstimatedHours;
    const accuracy = avgEstimatedHours > 0 
      ? ((1 - Math.abs(variance) / avgEstimatedHours) * 100).toFixed(1)
      : 100;

    return {
      avgActualHours: avgActualHours.toFixed(1),
      avgEstimatedHours: avgEstimatedHours.toFixed(1),
      variance: variance.toFixed(1),
      accuracy
    };
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Avg Daily Output
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{capacityAnalysis.avgDailyCompletion}</div>
            <p className="text-xs text-slate-500 mt-1">tasks per day</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Queue Completion
            </CardTitle>
            <Clock className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{capacityAnalysis.estimatedDaysToComplete}</div>
            <p className="text-xs text-slate-500 mt-1">days to clear queue</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Time Accuracy
            </CardTitle>
            <Package className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{bottlenecks.accuracy}%</div>
            <p className="text-xs text-slate-500 mt-1">estimation accuracy</p>
          </CardContent>
        </Card>
      </div>

      {/* Historical Performance */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Historical Performance (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#10b981" name="Tasks Completed" />
              <Bar dataKey="hours" fill="#3b82f6" name="Hours Worked" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Forecast */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">7-Day Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="scheduled" 
                stroke="#0ea5e9" 
                strokeWidth={2}
                name="Scheduled Tasks" 
              />
              <Line 
                type="monotone" 
                dataKey="forecast" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Projected Completion" 
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Capacity Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Tasks in Queue:</span>
              <span className="font-semibold text-slate-900">{capacityAnalysis.totalScheduled}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Currently Active:</span>
              <span className="font-semibold text-slate-900">{capacityAnalysis.totalInProgress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Average Completion Rate:</span>
              <span className="font-semibold text-slate-900">{capacityAnalysis.avgDailyCompletion} tasks/day</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Projected Clear Date:</span>
              <span className="font-semibold text-slate-900">{capacityAnalysis.projectedCompletionDate}</span>
            </div>
            <div className="flex justify-between pt-3 border-t">
              <span className="text-slate-600">Avg Estimated Time:</span>
              <span className="font-semibold text-slate-900">{bottlenecks.avgEstimatedHours}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Avg Actual Time:</span>
              <span className="font-semibold text-slate-900">{bottlenecks.avgActualHours}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Time Variance:</span>
              <span className={`font-semibold ${parseFloat(bottlenecks.variance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {bottlenecks.variance > 0 ? '+' : ''}{bottlenecks.variance}h
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}