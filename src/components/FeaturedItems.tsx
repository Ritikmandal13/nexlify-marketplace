import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Star, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabaseClient';

interface Listing {
  id: string;
  title: string;
  price: number;
  images: string[];
  location: string;
  seller_name: string;
  condition: string;
  category: string;
  seller_avatar_url?: string;
  status: string;
}

const FeaturedItems = () => {
  const navigate = useNavigate();
  const [featuredItems, setFeaturedItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch latest 4 listings from Supabase
    const fetchFeatured = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('listings').select('*').order('created_at', { ascending: false }).limit(4);
      if (error) {
        console.error('Error fetching featured items:', error.message);
        setFeaturedItems([]);
      } else {
        setFeaturedItems(data || []);
      }
      setLoading(false);
    };
    fetchFeatured();
  }, []);

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
          {loading ? (
            // Loading skeletons
            [...Array(4)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : featuredItems.length === 0 ? (
            // Empty state
            <div className="col-span-2">
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                <div className="max-w-md mx-auto">
                  <div className="text-gray-500 mb-4 text-lg">
                    <p className="font-medium text-gray-900 mb-2">Welcome to SmartThrift!</p>
                    <p className="text-gray-600">Be the first to list an item and start trading with your college community.</p>
                  </div>
                  <Button 
                    onClick={() => navigate('/create-listing')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Plus size={16} className="mr-2" />
                    Create First Listing
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            featuredItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100">
                <div className="relative">
                  <img 
                    src={item.images[0] || "/placeholder.svg"} 
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
                  {item.status === 'sold' && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                      <div className="text-center">
                        <div className="bg-red-600 text-white font-bold text-xl px-6 py-3 rounded-lg shadow-2xl transform rotate-[-10deg] border-4 border-white">
                          SOLD OUT
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 flex-1 mr-2">
                      {item.title}
                    </h3>
                    <span className="text-xl font-bold text-blue-600">
                      ₹{item.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-gray-600 text-sm mb-3">
                    <MapPin size={14} className="mr-1" />
                    <span>{item.location}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      {item.seller_avatar_url ? (
                        <img
                          src={
                            item.seller_avatar_url.startsWith('http')
                              ? item.seller_avatar_url
                              : `https://spjvuhlgitqnthcvnpyb.supabase.co/storage/v1/object/public/avatars/${item.seller_avatar_url}`
                          }
                          alt={item.seller_name + ' avatar'}
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {(item.seller_name || 'U').charAt(0)}
                        </div>
                      )}
                      <span className="ml-2 text-sm text-gray-700">{item.seller_name || 'Unknown'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm"
                      onClick={() => {
                        if (item.id.startsWith('default-')) {
                          navigate('/marketplace');
                        } else {
                          navigate(`/listing/${item.id}`);
                        }
                      }}
                      disabled={item.status === 'sold'}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="text-center mt-8">
          <Button 
            size="lg" 
            variant="outline" 
            className="px-8"
            onClick={() => navigate('/marketplace')}
          >
            View All Items
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedItems;
