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
          <div className="max-w-2xl mx-auto mb-2">
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input 
                  placeholder="What are you looking for?" 
                  className="pl-10 h-12 text-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input 
                    placeholder="Location" 
                    className="pl-10 h-12 text-lg"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                  />
                </div>
                <Button 
                  className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={handleSearch}
                >
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
