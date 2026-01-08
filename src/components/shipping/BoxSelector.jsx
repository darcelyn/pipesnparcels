import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Package, Box, Ruler } from "lucide-react";

export default function BoxSelector({ 
  boxes, 
  selectedBox, 
  onSelectBox, 
  customDimensions,
  onCustomDimensionsChange,
  suggestedBox 
}) {
  const [showCustom, setShowCustom] = React.useState(false);

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Box className="w-5 h-5 text-teal-600" />
          Select Box
        </CardTitle>
      </CardHeader>
      <CardContent>
        {suggestedBox && (
          <div className="mb-4 p-3 bg-teal-50 rounded-lg border border-teal-200">
            <p className="text-sm text-teal-800">
              <span className="font-medium">Suggested:</span> {suggestedBox.name} 
              <span className="text-teal-600 ml-1">
                ({suggestedBox.length}" × {suggestedBox.width}" × {suggestedBox.height}")
              </span>
            </p>
          </div>
        )}

        <RadioGroup 
          value={showCustom ? 'custom' : selectedBox?.id} 
          onValueChange={(value) => {
            if (value === 'custom') {
              setShowCustom(true);
              onSelectBox(null);
            } else {
              setShowCustom(false);
              const box = boxes.find(b => b.id === value);
              onSelectBox(box);
            }
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
            {boxes.map((box) => (
              <div key={box.id} className="relative">
                <RadioGroupItem
                  value={box.id}
                  id={box.id}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={box.id}
                  className={`flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all
                    ${selectedBox?.id === box.id && !showCustom
                      ? 'border-teal-500 bg-teal-50' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                >
                  <span className="font-medium text-slate-900 text-sm">{box.name}</span>
                  <span className="text-xs text-slate-500 mt-0.5">
                    {box.length}" × {box.width}" × {box.height}"
                  </span>
                  {box.best_for && (
                    <span className="text-xs text-slate-400 mt-1">{box.best_for}</span>
                  )}
                </Label>
              </div>
            ))}
            
            <div className="relative">
              <RadioGroupItem
                value="custom"
                id="custom-box"
                className="peer sr-only"
              />
              <Label
                htmlFor="custom-box"
                className={`flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all h-full justify-center items-center
                  ${showCustom 
                    ? 'border-teal-500 bg-teal-50' 
                    : 'border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                  }`}
              >
                <Ruler className="w-5 h-5 text-slate-400 mb-1" />
                <span className="font-medium text-slate-700 text-sm">Custom Dimensions</span>
              </Label>
            </div>
          </div>
        </RadioGroup>

        {showCustom && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm font-medium text-slate-700 mb-3">Enter custom dimensions (inches)</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-slate-500">Length</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={customDimensions.length}
                  onChange={(e) => onCustomDimensionsChange('length', parseFloat(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Width</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={customDimensions.width}
                  onChange={(e) => onCustomDimensionsChange('width', parseFloat(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Height</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={customDimensions.height}
                  onChange={(e) => onCustomDimensionsChange('height', parseFloat(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}