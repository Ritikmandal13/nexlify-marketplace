import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { PriceRangeSlider } from './PriceRangeSlider';
import { X, Filter as FilterIcon, MapPin } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export interface FilterState {
  priceRange: [number, number];
  distance: number | null;
  rating: number | null;
  conditions: string[];
  sortBy: string;
}

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClearAll: () => void;
  resultCount: number;
  className?: string;
  isMobile?: boolean;
  onClose?: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onClearAll,
  resultCount,
  className = '',
  isMobile = false,
  onClose
}) => {
  const conditions = [
    { value: 'new', label: 'New' },
    { value: 'like-new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'used', label: 'Used' }
  ];

  const distanceOptions = [
    { value: null, label: 'Any Distance' },
    { value: 1, label: 'Within 1 km' },
    { value: 5, label: 'Within 5 km' },
    { value: 10, label: 'Within 10 km' },
    { value: 25, label: 'Within 25 km' }
  ];

  const ratingOptions = [
    { value: null, label: 'Any Rating' },
    { value: 4, label: '4+ Stars' },
    { value: 3, label: '3+ Stars' },
    { value: 2, label: '2+ Stars' }
  ];

  const handleConditionToggle = (condition: string) => {
    const newConditions = filters.conditions.includes(condition)
      ? filters.conditions.filter(c => c !== condition)
      : [...filters.conditions, condition];
    
    onFilterChange({ ...filters, conditions: newConditions });
  };

  const activeFilterCount = 
    (filters.distance !== null ? 1 : 0) +
    (filters.rating !== null ? 1 : 0) +
    filters.conditions.length +
    (filters.priceRange[0] !== 0 || filters.priceRange[1] !== 100000 ? 1 : 0);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <FilterIcon size={20} className="text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {isMobile && onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={20} />
          </Button>
        )}
      </div>

      {/* Filter Content */}
      <div className="p-4 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Price Range */}
        <div>
          <PriceRangeSlider
            min={0}
            max={100000}
            value={filters.priceRange}
            onChange={(value) => onFilterChange({ ...filters, priceRange: value })}
          />
        </div>

        {/* Distance Filter */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <MapPin size={16} />
            Distance
          </Label>
          <RadioGroup
            value={filters.distance?.toString() || 'null'}
            onValueChange={(value) => 
              onFilterChange({ 
                ...filters, 
                distance: value === 'null' ? null : Number(value) 
              })
            }
          >
            {distanceOptions.map((option) => (
              <div key={option.value?.toString() || 'null'} className="flex items-center space-x-2">
                <RadioGroupItem 
                  value={option.value?.toString() || 'null'} 
                  id={`distance-${option.value}`} 
                />
                <Label 
                  htmlFor={`distance-${option.value}`}
                  className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Rating Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Minimum Rating
          </Label>
          <RadioGroup
            value={filters.rating?.toString() || 'null'}
            onValueChange={(value) => 
              onFilterChange({ 
                ...filters, 
                rating: value === 'null' ? null : Number(value) 
              })
            }
          >
            {ratingOptions.map((option) => (
              <div key={option.value?.toString() || 'null'} className="flex items-center space-x-2">
                <RadioGroupItem 
                  value={option.value?.toString() || 'null'} 
                  id={`rating-${option.value}`} 
                />
                <Label 
                  htmlFor={`rating-${option.value}`}
                  className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Condition Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Condition
          </Label>
          <div className="space-y-2">
            {conditions.map((condition) => (
              <div key={condition.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`condition-${condition.value}`}
                  checked={filters.conditions.includes(condition.value)}
                  onCheckedChange={() => handleConditionToggle(condition.value)}
                />
                <Label
                  htmlFor={`condition-${condition.value}`}
                  className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  {condition.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Showing {resultCount} {resultCount === 1 ? 'result' : 'results'}
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={onClearAll}
          disabled={activeFilterCount === 0}
        >
          Clear All Filters
        </Button>
      </div>
    </div>
  );
};

