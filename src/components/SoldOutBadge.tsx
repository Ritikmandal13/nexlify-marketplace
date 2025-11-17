import React from 'react';

interface SoldOutBadgeProps {
  status?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const SoldOutBadge: React.FC<SoldOutBadgeProps> = ({ 
  status, 
  size = 'medium',
  className = '' 
}) => {
  if (status !== 'sold') return null;

  const sizeClasses = {
    small: 'text-xs px-2 py-1',
    medium: 'text-sm px-3 py-1.5',
    large: 'text-base px-4 py-2'
  };

  return (
    <div className={`inline-flex items-center gap-1 bg-red-600 text-white font-bold rounded ${sizeClasses[size]} ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-100"></span>
      </span>
      SOLD OUT
    </div>
  );
};

interface SoldOutOverlayProps {
  status?: string;
  showMessage?: boolean;
}

export const SoldOutOverlay: React.FC<SoldOutOverlayProps> = ({ 
  status,
  showMessage = true 
}) => {
  if (status !== 'sold') return null;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-10 rounded-lg">
      <div className="text-center">
        <div className="bg-red-600 text-white font-bold text-2xl md:text-4xl px-6 py-3 rounded-lg shadow-2xl transform rotate-[-10deg] border-4 border-white">
          SOLD OUT
        </div>
        {showMessage && (
          <p className="text-white text-sm mt-3 bg-black bg-opacity-50 px-4 py-2 rounded">
            This item has been sold
          </p>
        )}
      </div>
    </div>
  );
};

export default SoldOutBadge;

