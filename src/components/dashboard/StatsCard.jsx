import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatsCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  trend,
  trendDirection = "up",
  color = "teal"
}) {
  const colorClasses = {
    teal: {
      bg: "bg-teal-50",
      icon: "text-teal-600",
      trend: trendDirection === "up" ? "text-emerald-600" : "text-red-500"
    },
    blue: {
      bg: "bg-blue-50",
      icon: "text-blue-600",
      trend: trendDirection === "up" ? "text-emerald-600" : "text-red-500"
    },
    purple: {
      bg: "bg-purple-50",
      icon: "text-purple-600",
      trend: trendDirection === "up" ? "text-emerald-600" : "text-red-500"
    },
    amber: {
      bg: "bg-amber-50",
      icon: "text-amber-600",
      trend: trendDirection === "up" ? "text-emerald-600" : "text-red-500"
    },
    rose: {
      bg: "bg-rose-50",
      icon: "text-rose-600",
      trend: trendDirection === "up" ? "text-emerald-600" : "text-red-500"
    }
  };

  const colors = colorClasses[color] || colorClasses.teal;

  return (
    <Card className="border-slate-200 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
            {subtitle && (
              <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${colors.trend}`}>
                {trendDirection === "up" ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>{trend}</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={`p-3 rounded-xl ${colors.bg}`}>
              <Icon className={`w-6 h-6 ${colors.icon}`} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}