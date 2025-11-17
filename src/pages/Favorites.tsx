import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Heart } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  location: string;
  images: string[];
  seller_id: string;
  seller_name: string;
  seller_avatar_url?: string;
  created_at: string;
}

const Favorites = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setFavorites([]);
          setLoading(false);
          return;
        }

        // Get user's favorite listings
        const { data: favoritesData, error: favoritesError } = await supabase
          .from('favorites')
          .select('listing_id')
          .eq('user_id', user.id);

        if (favoritesError) throw favoritesError;

        if (favoritesData && favoritesData.length > 0) {
          // Get the actual listings data
          const listingIds = favoritesData.map(fav => fav.listing_id);
          const { data: listings, error: listingsError } = await supabase
            .from('listings')
            .select('*')
            .in('id', listingIds)
            .order('created_at', { ascending: false });

          if (listingsError) throw listingsError;
          setFavorites(listings || []);
        } else {
          setFavorites([]);
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
        toast({
          title: "Error",
          description: "Failed to load favorites.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [toast]);

  const handleRemoveFavorite = async (listingId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('listing_id', listingId);

      if (error) throw error;

      setFavorites(prev => prev.filter(listing => listing.id !== listingId));
      toast({
        title: "Removed from favorites",
        description: "Item has been removed from your favorites.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove from favorites.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">My Favorites</h1>
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">You haven't added any items to your favorites yet.</div>
            <Button onClick={() => navigate('/marketplace')}>
              Browse Marketplace
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((listing) => (
              <Card key={listing.id} className="hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={listing.images[0] || '/placeholder.svg'}
                    alt={listing.title}
                    className="w-full h-48 object-cover rounded-t-lg cursor-pointer"
                    onClick={() => navigate(`/listing/${listing.id}`)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                    onClick={() => handleRemoveFavorite(listing.id)}
                  >
                    <Heart size={16} className="text-red-500 fill-current" />
                  </Button>
                  <Badge className="absolute top-2 left-2 bg-green-500 text-white capitalize">
                    {listing.condition}
                  </Badge>
                  {listing.status === 'sold' && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-t-lg z-10">
                      <div className="text-center">
                        <div className="bg-red-600 text-white font-bold text-xl px-6 py-3 rounded-lg shadow-2xl transform rotate-[-10deg] border-4 border-white">
                          SOLD OUT
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 truncate flex-1 mr-2">
                      {listing.title}
                    </h3>
                    <span className="text-xl font-bold text-blue-600">
                      ₹{listing.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {listing.description}
                  </p>
                  <div className="flex items-center text-gray-600 text-sm">
                    <MapPin size={14} className="mr-1" />
                    <span>{listing.location}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites; 