import React from 'react';
import { MapPin, Shield, Zap } from 'lucide-react';

const FeaturesSection = () => (
  <div className="bg-gradient-to-br from-blue-50 to-purple-50 py-12">
    <div className="max-w-4xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
);

export default FeaturesSection; 