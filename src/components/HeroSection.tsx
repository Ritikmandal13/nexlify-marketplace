
import React from 'react';
import { MapPin, Search, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const HeroSection = () => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
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
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input 
                  placeholder="What are you looking for?" 
                  className="pl-10 h-12 text-lg"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input 
                    placeholder="Location" 
                    className="pl-10 h-12 text-lg"
                  />
                </div>
                <Button className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Search
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile-optimized Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="text-white" size={32} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Map Discovery</h3>
              <p className="text-gray-600 text-sm">Find items and sellers near you with our interactive map</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-white" size={32} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Safe Trading</h3>
              <p className="text-gray-600 text-sm">Verified users and safe meeting spots for secure transactions</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="text-white" size={32} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Instant Chat</h3>
              <p className="text-gray-600 text-sm">Real-time messaging to connect with buyers and sellers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
