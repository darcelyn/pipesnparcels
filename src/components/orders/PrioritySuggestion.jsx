import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  TrendingUp, 
  AlertCircle,
  Loader2,
  Check,
  X
} from "lucide-react";

export default function PrioritySuggestion({ order, onAccept, onClose }) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [error, setError] = useState(null);

  const analyzePriority = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data } = await base44.functions.invoke('suggestOrderPriority', {
        order_id: order.id
      });
      setSuggestion(data);
    } catch (err) {
      setError('Failed to analyze order. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (suggestion) {
      onAccept(suggestion.suggested_priority);
    }
  };

  const priorityColors = {
    rush: 'bg-red-100 text-red-800 border-red-200',
    priority: 'bg-orange-100 text-orange-800 border-orange-200',
    normal: 'bg-slate-100 text-slate-800 border-slate-200'
  };

  const confidenceColors = {
    high: 'text-green-600',
    medium: 'text-yellow-600',
    low: 'text-orange-600'
  };

  return (
    <Card className="border-purple-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Priority Assistant
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {!suggestion && !loading && (
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-slate-600 mb-4">
              Let AI analyze this order and suggest the optimal priority level based on order value, shipping requirements, and urgency indicators.
            </p>
            <Button 
              onClick={analyzePriority}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze Order
            </Button>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-slate-600">Analyzing order...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-4">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={analyzePriority}
              variant="outline"
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        )}

        {suggestion && !loading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Current Priority</p>
                <Badge className={priorityColors[suggestion.current_priority]}>
                  {suggestion.current_priority.toUpperCase()}
                </Badge>
              </div>
              <div className="text-slate-400 text-2xl">→</div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Suggested Priority</p>
                <Badge className={priorityColors[suggestion.suggested_priority]}>
                  {suggestion.suggested_priority.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-slate-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 mb-1">Reasoning</p>
                  <p className="text-sm text-slate-600">{suggestion.reasoning}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  Confidence: <span className={`font-medium ${confidenceColors[suggestion.confidence]}`}>
                    {suggestion.confidence.toUpperCase()}
                  </span>
                </p>
              </div>
            </div>

            {suggestion.suggested_priority !== suggestion.current_priority && (
              <div className="flex gap-3">
                <Button 
                  onClick={handleAccept}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Apply Suggestion
                </Button>
                <Button 
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                >
                  Keep Current
                </Button>
              </div>
            )}

            {suggestion.suggested_priority === suggestion.current_priority && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">Priority is optimal</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}