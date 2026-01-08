import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import CarrierLogo from "@/components/ui/CarrierLogo";
import { 
  DollarSign, 
  Clock, 
  Zap,
  TrendingDown,
  Calendar,
  Loader2
} from "lucide-react";
import { format, addDays } from "date-fns";

export default function RateComparison({ 
  rates, 
  selectedRate, 
  onSelectRate, 
  isLoading,
  error 
}) {
  if (isLoading) {
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-teal-600" />
            Comparing Rates...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-slate-200">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <p className="text-red-700 text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const cheapestRate = rates.length > 0 ? rates.reduce((min, r) => r.price < min.price ? r : min, rates[0]) : null;
  const fastestRate = rates.length > 0 ? rates.reduce((min, r) => r.transitDays < min.transitDays ? r : min, rates[0]) : null;

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-teal-600" />
          Shipping Rates
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rates.length === 0 ? (
          <p className="text-slate-500 text-center py-8">
            Enter package details to see available rates
          </p>
        ) : (
          <RadioGroup 
            value={selectedRate?.id} 
            onValueChange={(value) => {
              const rate = rates.find(r => r.id === value);
              onSelectRate(rate);
            }}
          >
            <div className="space-y-2">
              {rates.map((rate) => (
                <div key={rate.id} className="relative">
                  <RadioGroupItem
                    value={rate.id}
                    id={rate.id}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={rate.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${selectedRate?.id === rate.id
                        ? 'border-teal-500 bg-teal-50' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                  >
                    <CarrierLogo carrier={rate.carrier} />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{rate.serviceName}</span>
                        {rate.id === cheapestRate?.id && (
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            Cheapest
                          </Badge>
                        )}
                        {rate.id === fastestRate?.id && rate.id !== cheapestRate?.id && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs">
                            <Zap className="w-3 h-3 mr-1" />
                            Fastest
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {rate.transitDays} day{rate.transitDays !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Est. {format(addDays(new Date(), rate.transitDays), 'MMM d')}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-bold text-slate-900">
                        ${rate.price.toFixed(2)}
                      </span>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        )}
      </CardContent>
    </Card>
  );
}