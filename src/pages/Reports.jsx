import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AIInsights from "@/components/reports/AIInsights";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, 
  Package, 
  Clock, 
  CheckCircle,
  Calendar as CalendarIcon,
  Download,
  FileText,
  Loader2
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay, differenceInDays, parseISO } from 'date-fns';

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [reportType, setReportType] = useState('overview');

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['all-orders'],
    queryFn: () => base44.entities.Order.list()
  });

  const { data: shipments = [], isLoading: shipmentsLoading } = useQuery({
    queryKey: ['all-shipments'],
    queryFn: () => base44.entities.Shipment.list()
  });

  const isLoading = ordersLoading || shipmentsLoading;

  // Filter data by date range
  const filteredOrders = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return orders;
    
    const from = startOfDay(dateRange.from);
    const to = endOfDay(dateRange.to);
    
    return orders.filter(order => {
      const orderDate = new Date(order.created_date);
      return orderDate >= from && orderDate <= to;
    });
  }, [orders, dateRange]);

  const filteredShipments = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return shipments;
    
    const from = startOfDay(dateRange.from);
    const to = endOfDay(dateRange.to);
    
    return shipments.filter(shipment => {
      const shipDate = new Date(shipment.created_date);
      return shipDate >= from && shipDate <= to;
    });
  }, [shipments, dateRange]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const daysInRange = differenceInDays(dateRange.to, dateRange.from) + 1;
    
    const fulfilledOrders = filteredOrders.filter(o => 
      ['shipped', 'delivered'].includes(o.status)
    );
    
    const ordersPerDay = (fulfilledOrders.length / daysInRange).toFixed(1);
    
    // Calculate average fulfillment time
    const fulfillmentTimes = fulfilledOrders
      .filter(o => o.created_date && o.updated_date)
      .map(o => {
        const created = new Date(o.created_date);
        const updated = new Date(o.updated_date);
        return differenceInDays(updated, created);
      });
    
    const avgFulfillmentTime = fulfillmentTimes.length > 0
      ? (fulfillmentTimes.reduce((a, b) => a + b, 0) / fulfillmentTimes.length).toFixed(1)
      : 0;
    
    // Calculate total items produced
    const totalItems = filteredOrders.reduce((sum, order) => {
      const itemCount = order.items?.reduce((s, item) => s + (item.quantity || 0), 0) || 0;
      return sum + itemCount;
    }, 0);

    return {
      ordersPerDay,
      avgFulfillmentTime,
      totalItems,
      totalOrders: filteredOrders.length,
      totalShipments: filteredShipments.length
    };
  }, [filteredOrders, filteredShipments, dateRange]);

  // Daily orders chart data
  const dailyOrdersData = useMemo(() => {
    const dateMap = {};
    const days = differenceInDays(dateRange.to, dateRange.from) + 1;
    
    // Initialize all dates
    for (let i = 0; i < days; i++) {
      const date = format(subDays(dateRange.to, days - 1 - i), 'MMM dd');
      dateMap[date] = { date, orders: 0, shipments: 0 };
    }
    
    // Count orders
    filteredOrders.forEach(order => {
      const date = format(new Date(order.created_date), 'MMM dd');
      if (dateMap[date]) {
        dateMap[date].orders++;
      }
    });
    
    // Count shipments
    filteredShipments.forEach(shipment => {
      const date = format(new Date(shipment.created_date), 'MMM dd');
      if (dateMap[date]) {
        dateMap[date].shipments++;
      }
    });
    
    return Object.values(dateMap);
  }, [filteredOrders, filteredShipments, dateRange]);

  // Status distribution
  const statusData = useMemo(() => {
    const statusCount = {};
    filteredOrders.forEach(order => {
      const status = order.status || 'unknown';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    return Object.entries(statusCount).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count
    }));
  }, [filteredOrders]);

  // Priority distribution
  const priorityData = useMemo(() => {
    const priorityCount = {};
    filteredOrders.forEach(order => {
      const priority = order.priority || 'normal';
      priorityCount[priority] = (priorityCount[priority] || 0) + 1;
    });
    
    return Object.entries(priorityCount).map(([priority, count]) => ({
      name: priority.charAt(0).toUpperCase() + priority.slice(1),
      value: count
    }));
  }, [filteredOrders]);

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Order Number', 'Customer', 'Status', 'Priority', 'Items', 'Created Date', 'Weight (lbs)'];
    const rows = filteredOrders.map(order => [
      order.order_number,
      order.customer_name,
      order.status,
      order.priority,
      order.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0,
      format(new Date(order.created_date), 'yyyy-MM-dd'),
      order.total_weight || 0
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  // Export to PDF (simple print view)
  const exportToPDF = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-700" />
              </div>
              Reports & Analytics
            </h1>
            <p className="text-slate-500 mt-1">
              {format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}
            </p>
          </div>
          <div className="flex gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="border-slate-300">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Date Range
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-3 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDateRange({
                      from: subDays(new Date(), 7),
                      to: new Date()
                    })}
                    className="w-full"
                  >
                    Last 7 Days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDateRange({
                      from: subDays(new Date(), 30),
                      to: new Date()
                    })}
                    className="w-full"
                  >
                    Last 30 Days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDateRange({
                      from: subDays(new Date(), 90),
                      to: new Date()
                    })}
                    className="w-full"
                  >
                    Last 90 Days
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="outline" onClick={exportToCSV} className="border-slate-300">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={exportToPDF} className="border-slate-300">
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* AI Insights */}
        <div className="mb-8">
          <AIInsights dateRange={dateRange} />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Orders/Day
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{kpis.ordersPerDay}</div>
              <p className="text-xs text-slate-500 mt-1">Average fulfillment rate</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Avg Fulfillment Time
              </CardTitle>
              <Clock className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{kpis.avgFulfillmentTime}</div>
              <p className="text-xs text-slate-500 mt-1">Days from order to shipment</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Items Produced
              </CardTitle>
              <Package className="w-4 h-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{kpis.totalItems}</div>
              <p className="text-xs text-slate-500 mt-1">Total units in period</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Orders
              </CardTitle>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{kpis.totalOrders}</div>
              <p className="text-xs text-slate-500 mt-1">{kpis.totalShipments} shipments created</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Orders Trend */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Daily Orders & Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyOrdersData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="orders" stroke="#0ea5e9" name="Orders" strokeWidth={2} />
                  <Line type="monotone" dataKey="shipments" stroke="#10b981" name="Shipments" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Order Status Distribution */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Order Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Order Volume by Day */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Order Volume Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyOrdersData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="orders" fill="#0ea5e9" name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Priority Distribution */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Priority Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Print-only summary */}
        <div className="hidden print:block">
          <h2 className="text-xl font-bold mb-4">Report Summary</h2>
          <div className="mb-4">
            <p><strong>Date Range:</strong> {format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}</p>
            <p><strong>Orders Per Day:</strong> {kpis.ordersPerDay}</p>
            <p><strong>Avg Fulfillment Time:</strong> {kpis.avgFulfillmentTime} days</p>
            <p><strong>Total Items Produced:</strong> {kpis.totalItems}</p>
            <p><strong>Total Orders:</strong> {kpis.totalOrders}</p>
            <p><strong>Total Shipments:</strong> {kpis.totalShipments}</p>
          </div>
        </div>
      </div>
    </div>
  );
}