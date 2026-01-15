import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle,
  Lightbulb,
  Loader2,
  CheckCircle
} from "lucide-react";

export default function AIInsights({ dateRange }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data } = await base44.functions.invoke('analyzeProductionInsights', {
        dateRange: {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString()
        }
      });
      setInsights(data);
    } catch (err) {
      setError('Failed to generate insights. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const severityColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-blue-100 text-blue-800 border-blue-200'
  };

  const impactColors = {
    high: 'bg-green-100 text-green-800',
    medium: 'bg-blue-100 text-blue-800',
    low: 'bg-slate-100 text-slate-800'
  };

  if (!insights && !loading) {
    return (
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              AI-Powered Production Insights
            </h3>
            <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
              Let AI analyze your production and fulfillment data to identify bottlenecks, 
              trends, and provide actionable recommendations for improvement.
            </p>
            <Button 
              onClick={analyzeData}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Insights
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border-purple-200">
        <CardContent className="py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-slate-600">Analyzing your production data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-6">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={analyzeData}
              variant="outline"
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Assessment */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Analysis
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={analyzeData}
              className="border-purple-300 text-purple-700 hover:bg-purple-100"
            >
              Refresh Analysis
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <p className="text-slate-700 leading-relaxed">
              {insights.insights.health_assessment}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bottlenecks */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Identified Bottlenecks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.insights.bottlenecks.map((bottleneck, idx) => (
              <div
                key={idx}
                className={`border-2 rounded-lg p-4 ${severityColors[bottleneck.severity]}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{bottleneck.title}</h4>
                  <Badge className={severityColors[bottleneck.severity]}>
                    {bottleneck.severity} priority
                  </Badge>
                </div>
                <p className="text-sm">{bottleneck.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            Recommended Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.insights.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <h4 className="font-semibold">{rec.title}</h4>
                  </div>
                  <Badge className={impactColors[rec.impact]}>
                    {rec.impact} impact
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 ml-7">{rec.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Trend */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Key Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 leading-relaxed">
            {insights.insights.key_trend}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}