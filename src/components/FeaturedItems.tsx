
import React from 'react';
import { Heart, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const FeaturedItems = () => {
  const items = [
    {
      id: 1,
      title: "MacBook Pro 13\" 2022",
      price: 1200,
      image: "/placeholder.svg",
      location: "Campus North",
      distance: "0.3 miles",
      seller: "Sarah M.",
      rating: 4.8,
      condition: "Like New",
      category: "Electronics"
    },
    {
      id: 2,
      title: "Vintage Leather Jacket",
      price: 80,
      image: "/placeholder.svg",
      location: "Downtown",
      distance: "0.8 miles",
      seller: "Mike R.",
      rating: 4.9,
      condition: "Good",
      category: "Fashion"
    },
    {
      id: 3,
      title: "Study Desk & Chair Set",
      price: 150,
      image: "/placeholder.svg",
      location: "Dorm Complex",
      distance: "0.1 miles",
      seller: "Emma K.",
      rating: 5.0,
      condition: "Excellent",
      category: "Furniture"
    },
    {
      id: 4,
      title: "Guitar - Acoustic",
      price: 250,
      image: "/placeholder.svg",
      location: "Music Hall",
      distance: "0.5 miles",
      seller: "David L.",
      rating: 4.7,
      condition: "Good",
      category: "Music"
    }
  ];

  return (
    <div className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Featured Items Near You
          </h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Discover amazing deals from verified sellers in your local community
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100">
              <div className="relative">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                >
                  <Heart size={16} />
                </Button>
                <Badge className="absolute top-2 left-2 bg-green-500 text-white">
                  {item.condition}
                </Badge>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-gray-900 flex-1 mr-2">
                    {item.title}
                  </h3>
                  <span className="text-xl font-bold text-blue-600">
                    ${item.price}
                  </span>
                </div>
                
                <div className="flex items-center text-gray-600 text-sm mb-3">
                  <MapPin size={14} className="mr-1" />
                  <span>{item.location} • {item.distance}</span>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {item.seller.charAt(0)}
                    </div>
                    <span className="ml-2 text-sm text-gray-700">{item.seller}</span>
                  </div>
                  <div className="flex items-center">
                    <Star size={14} className="text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm text-gray-600">{item.rating}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button size="lg" variant="outline" className="px-8">
            View All Items
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedItems;
