import React, { useState } from 'react';
import { MapPin, Search, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = () => {
    // Navigate to marketplace with search parameters
    navigate(`/marketplace?search=${encodeURIComponent(searchTerm)}&location=${encodeURIComponent(location)}`);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 py-2 lg:py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-0">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Your Local
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}Marketplace
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Buy and sell with your neighbors, classmates, and local community. 
            Discover amazing deals just around the corner.
          </p>
          
          {/* Mobile-optimized Search Bar */}
          {/* Removed search bar from homepage */}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
