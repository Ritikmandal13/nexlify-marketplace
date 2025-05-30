import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Plus, MapPin, Star, Heart } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { AuthUser } from '@/types/user';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

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
  status?: string;
}

const Marketplace = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'textbooks', label: 'Textbooks' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'sports equipment', label: 'Sports Equipment' },
    { value: 'music instruments', label: 'Music Instruments' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    // Get search parameters from URL
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('search');
    const locationQuery = searchParams.get('location');

    if (searchQuery) {
      setSearchTerm(searchQuery);
    }
    if (locationQuery) {
      // You can add location filtering logic here if needed
    }
  }, [location.search]);

  useEffect(() => {
    // Fetch listings from Supabase
    const fetchListings = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('listings').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching listings:', error.message);
        setListings([]);
      } else {
        setListings(data || []);
      }
      setLoading(false);
    };
    fetchListings();
  }, []);

  useEffect(() => {
    // Fetch user's favorites
    const fetchFavorites = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: favorites } = await supabase
        .from('favorites')
        .select('listing_id')
        .eq('user_id', user.id);

      if (favorites) {
        setFavoriteIds(favorites.map(fav => fav.listing_id));
      }
    };

    fetchFavorites();
  }, []);

  useEffect(() => {
    // Filter listings based on search and category
    let filtered = listings;

    if (searchTerm) {
      filtered = filtered.filter(listing =>
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(listing =>
        listing.category === selectedCategory
      );
    }

    setFilteredListings(filtered);
  }, [listings, searchTerm, selectedCategory]);

  const handleCreateListing = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('You must be signed in to create a listing.');
      return;
    }
    navigate('/create-listing');
  };

  const handleFavorite = async (listingId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking the heart
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to favorites.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (favoriteIds.includes(listingId)) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', listingId);

        if (error) throw error;

        setFavoriteIds(prev => prev.filter(id => id !== listingId));
        toast({
          title: "Removed from favorites",
          description: "Item has been removed from your favorites.",
        });
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            listing_id: listingId
          });

        if (error) throw error;

        setFavoriteIds(prev => [...prev, listingId]);
        toast({
          title: "Added to favorites",
          description: "Item has been added to your favorites.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update favorites.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
              <Button onClick={handleCreateListing} className="bg-blue-600 hover:bg-blue-700">
                <Plus size={16} className="mr-2" />
                Sell Item
              </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                <Input
                  placeholder="Search items..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-500" />
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-80 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                {listings.length === 0 ? 'No listings yet' : 'No items match your search'}
              </div>
              <Button onClick={handleCreateListing} variant="outline">
                <Plus size={16} className="mr-2" />
                Create First Listing
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredListings.map((listing) => (
                <Card key={listing.id} className="hover:shadow-lg focus:shadow-lg transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500" onClick={() => navigate(`/listing/${listing.id}`)} tabIndex={0}>
                  <div className="relative">
                    <img
                      src={listing.images[0] || '/placeholder.svg'}
                      alt={listing.title + ' image'}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                      onClick={(e) => handleFavorite(listing.id, e)}
                      aria-label={favoriteIds.includes(listing.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart size={16} className={favoriteIds.includes(listing.id) ? "text-red-500 fill-current" : ""} />
                    </Button>
                    <Badge className="absolute top-2 left-2 bg-green-500 text-white capitalize">
                      {listing.condition}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">{listing.title}</h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{listing.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        {listing.seller_avatar_url ? (
                          <img
                            src={
                              listing.seller_avatar_url.startsWith('http')
                                ? listing.seller_avatar_url
                                : `https://spjvuhlgitqnthcvnpyb.supabase.co/storage/v1/object/public/avatars/${listing.seller_avatar_url}`
                            }
                            alt={listing.seller_name + ' avatar'}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '';
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {(listing.seller_name || 'U').charAt(0)}
                          </div>
                        )}
                        <span className="ml-2 text-sm text-gray-700">{listing.seller_name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center">
                        <Star size={14} className="text-yellow-400 fill-current" aria-label="Rating star" />
                        <span className="ml-1 text-sm text-gray-600">4.8</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-gray-900">${listing.price}</div>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin size={14} className="mr-1" aria-label="Location" />
                        {listing.location}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Marketplace;
