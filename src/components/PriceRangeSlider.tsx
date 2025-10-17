import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface PriceRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  className?: string;
}

export const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
  min,
  max,
  value,
  onChange,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Price Range
        </Label>
        <div className="flex items-center justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold">₹{value[0].toLocaleString('en-IN')}</span>
          <span className="text-gray-400">—</span>
          <span className="font-semibold">₹{value[1].toLocaleString('en-IN')}</span>
        </div>
      </div>
      
      <Slider
        min={min}
        max={max}
        step={100}
        value={value}
        onValueChange={onChange}
        className="w-full"
      />
      
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>₹{min.toLocaleString('en-IN')}</span>
        <span>₹{max.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
};

