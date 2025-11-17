import React from 'react';
import { CheckCircle } from 'lucide-react';

interface SoldBadgeProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * SoldBadge Component
 * 
 * Displays a "SOLD OUT" overlay badge on listing cards and images
 * Used to indicate that an item has been sold
 */
export const SoldBadge: React.FC<SoldBadgeProps> = ({ 
  size = 'medium',
  className = '' 
}) => {
  const sizeClasses = {
    small: 'text-xs px-2 py-1',
    medium: 'text-sm px-3 py-1.5',
    large: 'text-base px-4 py-2'
  };

  const iconSizes = {
    small: 14,
    medium: 16,
    large: 20
  };

  return (
    <div 
      className={`
        absolute top-2 right-2 
        bg-red-600 text-white font-bold
        ${sizeClasses[size]}
        rounded-md shadow-lg
        flex items-center gap-1.5
        z-10
        animate-in fade-in zoom-in duration-200
        ${className}
      `}
      role="status"
      aria-label="This item has been sold"
    >
      <CheckCircle size={iconSizes[size]} />
      <span>SOLD OUT</span>
    </div>
  );
};

/**
 * SoldOverlay Component
 * 
 * Full overlay that covers entire card with semi-transparent background
 * and centered SOLD OUT text
 */
export const SoldOverlay: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div 
      className={`
        absolute inset-0 
        bg-black/60 backdrop-blur-sm
        flex items-center justify-center
        z-20
        rounded-lg
        ${className}
      `}
      role="status"
      aria-label="This item has been sold"
    >
      <div className="text-center">
        <div className="bg-red-600 text-white font-bold text-2xl px-8 py-4 rounded-lg shadow-2xl transform rotate-[-10deg] border-4 border-white">
          <CheckCircle size={32} className="inline-block mr-2" />
          SOLD OUT
        </div>
        <p className="text-white text-sm mt-3 font-medium">
          This item is no longer available
        </p>
      </div>
    </div>
  );
};

export default SoldBadge;

