import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  X, 
  Settings, 
  Play, 
  Calendar, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Zap
} from "lucide-react";

export default function PlanningGuide({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Production Planning Guide</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6">
          <Tabs defaultValue="setup">
            <TabsList className="mb-6">
              <TabsTrigger value="setup">Setup</TabsTrigger>
              <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
              <TabsTrigger value="tracking">Tracking</TabsTrigger>
              <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
            </TabsList>

            {/* Setup Tab */}
            <TabsContent value="setup">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Settings className="w-5 h-5 text-blue-600" />
                      Initial Setup
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">1. Configure Workstations</h4>
                      <p className="text-sm text-slate-600 mb-2">
                        Go to Settings and create your workstations (machines, production lines, or work areas):
                      </p>
                      <ul className="text-sm text-slate-600 space-y-1 ml-6 list-disc">
                        <li>Enter a descriptive name (e.g., "CNC Machine 1", "Assembly Line A")</li>
                        <li>Set the type of work performed</li>
                        <li>Define capacity hours per day (typically 8-24 hours)</li>
                        <li>Set efficiency rate (1.0 = 100% efficiency)</li>
                        <li>Add maintenance schedules if needed</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">2. Prepare Orders</h4>
                      <p className="text-sm text-slate-600">
                        Ensure orders are in "production" status before scheduling. Orders in pending status 
                        should be moved to production when ready to manufacture.
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">Pro Tip</p>
                          <p className="text-sm text-blue-700">
                            Start with 1-2 workstations and expand as needed. You can always add more later.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Scheduling Tab */}
            <TabsContent value="scheduling">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Scheduling Tasks
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-600" />
                        Auto-Scheduling
                      </h4>
                      <p className="text-sm text-slate-600 mb-2">
                        The fastest way to schedule multiple orders:
                      </p>
                      <ol className="text-sm text-slate-600 space-y-1 ml-6 list-decimal">
                        <li>Click "Auto-Schedule" button in the header</li>
                        <li>System analyzes unscheduled orders in production</li>
                        <li>Orders are sorted by priority (rush → priority → normal)</li>
                        <li>Tasks are distributed across workstations</li>
                        <li>Time estimates are based on item quantities (0.5 hours per item)</li>
                      </ol>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Manual Scheduling</h4>
                      <p className="text-sm text-slate-600 mb-2">
                        For custom tasks or fine-tuned control:
                      </p>
                      <ol className="text-sm text-slate-600 space-y-1 ml-6 list-decimal">
                        <li>Click "New Task" button</li>
                        <li>Select an order or create a custom task</li>
                        <li>Choose workstation and priority</li>
                        <li>Set scheduled start date and estimated hours</li>
                        <li>Add any special notes</li>
                      </ol>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Schedule Timeline</h4>
                      <p className="text-sm text-slate-600">
                        View your weekly schedule in the "Schedule Timeline" tab:
                      </p>
                      <ul className="text-sm text-slate-600 space-y-1 ml-6 list-disc">
                        <li>Navigate weeks using arrow buttons</li>
                        <li>Click "Today" to return to current week</li>
                        <li>Tasks are color-coded by status and priority</li>
                        <li>Click tasks to start/complete them directly</li>
                      </ul>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-900">Best Practice</p>
                          <p className="text-sm text-amber-700">
                            Review and adjust auto-scheduled tasks as needed. The system provides a starting point, 
                            but your expertise should guide final scheduling decisions.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tracking Tab */}
            <TabsContent value="tracking">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Play className="w-5 h-5 text-blue-600" />
                      Work in Progress Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Task Status Flow</h4>
                      <div className="flex items-center gap-2 text-sm mb-3">
                        <div className="px-3 py-1 bg-slate-100 border border-slate-300 rounded">Scheduled</div>
                        <span>→</span>
                        <div className="px-3 py-1 bg-blue-100 border border-blue-300 rounded">In Progress</div>
                        <span>→</span>
                        <div className="px-3 py-1 bg-green-100 border border-green-300 rounded">Completed</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Starting a Task</h4>
                      <ol className="text-sm text-slate-600 space-y-1 ml-6 list-decimal">
                        <li>Go to "Work in Progress" tab or Schedule Timeline</li>
                        <li>Find the scheduled task</li>
                        <li>Click the Play (▶) icon to start</li>
                        <li>System records actual start time automatically</li>
                      </ol>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Completing a Task</h4>
                      <ol className="text-sm text-slate-600 space-y-1 ml-6 list-decimal">
                        <li>Go to "Work in Progress" tab</li>
                        <li>Find the active task</li>
                        <li>Click "Complete" button</li>
                        <li>System calculates actual hours worked</li>
                      </ol>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Blocking Tasks</h4>
                      <p className="text-sm text-slate-600 mb-2">
                        When a task cannot proceed (material shortage, equipment issue, etc.):
                      </p>
                      <ol className="text-sm text-slate-600 space-y-1 ml-6 list-decimal">
                        <li>Click "Block" button on active task</li>
                        <li>Enter reason for blockage</li>
                        <li>Task moves to blocked section</li>
                        <li>Click "Resume" when issue is resolved</li>
                      </ol>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Workstation Utilization</h4>
                      <p className="text-sm text-slate-600">
                        Track how busy each workstation is:
                      </p>
                      <ul className="text-sm text-slate-600 space-y-1 ml-6 list-disc">
                        <li>Green bars (0-70%): Good capacity available</li>
                        <li>Yellow bars (70-90%): Near capacity</li>
                        <li>Red bars (90-100%+): Overloaded</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Forecasting Tab */}
            <TabsContent value="forecasting">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Production Forecasting
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Understanding the Metrics</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-slate-700">Avg Daily Output</p>
                          <p className="text-sm text-slate-600">
                            Average number of tasks your team completes per day based on last 7 days of data.
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-slate-700">Queue Completion</p>
                          <p className="text-sm text-slate-600">
                            Estimated days to complete all scheduled tasks at current pace. 
                            Calculation: Total scheduled tasks ÷ Average daily output.
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-slate-700">Time Accuracy</p>
                          <p className="text-sm text-slate-600">
                            How accurate your time estimates are. Compares estimated vs actual hours. 
                            Use this to improve future estimates.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Using Historical Data</h4>
                      <p className="text-sm text-slate-600 mb-2">
                        The "Historical Performance" chart shows:
                      </p>
                      <ul className="text-sm text-slate-600 space-y-1 ml-6 list-disc">
                        <li>Tasks completed per day (last 7 days)</li>
                        <li>Total hours worked per day</li>
                        <li>Trends and patterns in your production</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">7-Day Forecast</h4>
                      <p className="text-sm text-slate-600 mb-2">
                        Projected completion rate for the next week:
                      </p>
                      <ul className="text-sm text-slate-600 space-y-1 ml-6 list-disc">
                        <li><strong>Blue line:</strong> Tasks scheduled to be completed</li>
                        <li><strong>Purple dashed line:</strong> Projected actual completions based on historical pace</li>
                        <li>Gap between lines indicates if you're over/under scheduled</li>
                      </ul>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-900">Pro Tip</p>
                          <p className="text-sm text-green-700">
                            If Time Accuracy is low, adjust your estimation factor. If tasks consistently take 
                            longer than estimated, increase your base estimate (e.g., from 0.5 to 0.75 hours per item).
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Quick Reference */}
          <Card className="mt-6 bg-slate-50 border-slate-300">
            <CardHeader>
              <CardTitle className="text-base">Quick Reference: Color Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-slate-100 border-2 border-slate-300 rounded"></div>
                  <span>Scheduled (not started)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded"></div>
                  <span>In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
                  <span>Blocked / Rush Priority</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-100 border-2 border-orange-300 rounded"></div>
                  <span>Rush Priority</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-300 rounded"></div>
                  <span>Priority</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}