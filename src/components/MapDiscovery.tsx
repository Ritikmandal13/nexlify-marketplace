
import React from 'react';
import { MapPin, Filter, Layers, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const MapDiscovery = () => {
  return (
    <div className="py-8 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Discover with Our Interactive Map
          </h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Visualize items and sellers around you. Filter by category, price, and distance.
          </p>
        </div>

        {/* Mobile-first layout */}
        <div className="space-y-6">
          {/* Map Placeholder - Mobile optimized */}
          <div className="bg-gray-200 rounded-lg h-64 md:h-96 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              <div className="text-center">
                <MapPin size={48} className="mx-auto mb-4 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Interactive Map View</h3>
                <p className="text-sm text-gray-600">Coming soon - Find items near you</p>
              </div>
            </div>
            
            {/* Mock map pins */}
            <div className="absolute top-1/4 left-1/3 w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div className="absolute top-1/2 right-1/4 w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div className="absolute bottom-1/3 left-1/2 w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>

          {/* Mobile-optimized filters */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Filter className="mr-2" size={20} />
              Quick Filters
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Categories</label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default" className="text-xs">Electronics</Badge>
                  <Badge variant="secondary" className="text-xs">Furniture</Badge>
                  <Badge variant="secondary" className="text-xs">Books</Badge>
                  <Badge variant="secondary" className="text-xs">Fashion</Badge>
                  <Badge variant="secondary" className="text-xs">More</Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Distance</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                    <option>1 mile</option>
                    <option>5 miles</option>
                    <option>10 miles</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Price</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                    <option>Any price</option>
                    <option>Under $50</option>
                    <option>$50-$200</option>
                    <option>$200+</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions for mobile */}
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="flex items-center justify-center gap-2 h-12">
              <Navigation size={16} />
              My Location
            </Button>
            <Button variant="outline" className="flex items-center justify-center gap-2 h-12">
              <Layers size={16} />
              Satellite View
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapDiscovery;
