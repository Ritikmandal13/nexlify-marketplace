import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Plus, MapPin, Star, Heart, SlidersHorizontal } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { AuthUser } from '@/types/user';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { StarRatingDisplay } from '@/components/ui/star-rating';
import { FilterPanel, FilterState } from '@/components/FilterPanel';
import { SortDropdown } from '@/components/SortDropdown';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

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
  average_rating?: number;
  review_count?: number;
}

const Marketplace = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 100000],
    distance: null,
    rating: null,
    conditions: [],
    sortBy: 'newest'
  });

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
    // Fetch listings from Supabase with ratings
    const fetchListings = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('listings').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching listings:', error.message);
        setListings([]);
      } else {
        // Fetch ratings for each listing
        const listingsWithRatings = await Promise.all(
          (data || []).map(async (listing) => {
            const { data: reviews } = await supabase
              .from('reviews')
              .select('rating')
              .eq('listing_id', listing.id);
            
            const reviewCount = reviews?.length || 0;
            const averageRating = reviewCount > 0
              ? reviews!.reduce((sum, r) => sum + r.rating, 0) / reviewCount
              : 0;

            return {
              ...listing,
              review_count: reviewCount,
              average_rating: Number(averageRating.toFixed(1)),
            };
          })
        );
        
        setListings(listingsWithRatings);
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

  // Advanced filtering and sorting logic
  const filteredAndSortedListings = useMemo(() => {
    let filtered = listings;

    // Search term filter
    if (searchTerm) {
      filtered = filtered.filter(listing =>
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(listing =>
        listing.category === selectedCategory
      );
    }

    // Price range filter
    filtered = filtered.filter(listing =>
      listing.price >= filters.priceRange[0] && 
      listing.price <= filters.priceRange[1]
    );

    // Condition filter
    if (filters.conditions.length > 0) {
      filtered = filtered.filter(listing =>
        filters.conditions.includes(listing.condition.toLowerCase().replace(/\s+/g, '-'))
      );
    }

    // Rating filter
    if (filters.rating !== null) {
      filtered = filtered.filter(listing =>
        (listing.average_rating || 0) >= filters.rating!
      );
    }

    // Distance filter (placeholder - you'd need actual geolocation)
    // if (filters.distance !== null) {
    //   // This would require latitude/longitude calculation
    //   // For now, it's a placeholder
    // }

    // Sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (filters.sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'rating-high':
          return (b.average_rating || 0) - (a.average_rating || 0);
        case 'most-reviewed':
          return (b.review_count || 0) - (a.review_count || 0);
        default:
          return 0;
      }
    });

    return sorted;
  }, [listings, searchTerm, selectedCategory, filters]);

  const handleClearFilters = () => {
    setFilters({
      priceRange: [0, 100000],
      distance: null,
      rating: null,
      conditions: [],
      sortBy: 'newest'
    });
  };

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
              
              {/* Desktop Sort & Mobile Filter Button */}
              <div className="flex items-center gap-3">
                <SortDropdown 
                  value={filters.sortBy}
                  onChange={(value) => setFilters({ ...filters, sortBy: value })}
                  className="hidden md:flex"
                />
                
                {/* Mobile Filter Button */}
                <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="md:hidden">
                      <SlidersHorizontal size={16} className="mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] p-0">
                    <FilterPanel
                      filters={filters}
                      onFilterChange={setFilters}
                      onClearAll={handleClearFilters}
                      resultCount={filteredAndSortedListings.length}
                      isMobile={true}
                      onClose={() => setShowMobileFilters(false)}
                    />
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>

        {/* Category Bar */}
        <div className="w-full overflow-x-auto py-2 mb-4">
          <div className="flex gap-2 min-w-max">
            {categories.map(cat => (
              <button
                key={cat.value}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition border border-gray-200 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${selectedCategory === cat.value
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow'
                    : 'bg-gray-100 text-gray-800 hover:bg-blue-50'}
                `}
                onClick={() => setSelectedCategory(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex gap-6">
            {/* Desktop Filter Sidebar */}
            <aside className="hidden md:block w-64 flex-shrink-0">
              <div className="sticky top-20">
                <FilterPanel
                  filters={filters}
                  onFilterChange={setFilters}
                  onClearAll={handleClearFilters}
                  resultCount={filteredAndSortedListings.length}
                />
              </div>
            </aside>

            {/* Listings Grid */}
            <div className="flex-1">
              {/* Mobile Sort Dropdown */}
              <div className="mb-4 md:hidden">
                <SortDropdown 
                  value={filters.sortBy}
                  onChange={(value) => setFilters({ ...filters, sortBy: value })}
                />
              </div>

              {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAndSortedListings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
              <div className="max-w-md mx-auto">
                <div className="text-gray-500 mb-4 text-lg">
                  {listings.length === 0 ? (
                    <>
                      <p className="font-medium text-gray-900 mb-2">Welcome to SmartThrift Marketplace!</p>
                      <p className="text-gray-600">Be the first to list an item and start trading with your college community.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-gray-900 mb-2">No matching items found</p>
                      <p className="text-gray-600">Try adjusting your search or filters to find what you're looking for.</p>
                    </>
                  )}
                </div>
                <Button 
                  onClick={handleCreateListing} 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus size={16} className="mr-2" />
                  {listings.length === 0 ? 'Create First Listing' : 'Create New Listing'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedListings.map((listing) => (
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
                    {listing.status === 'sold' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge className="bg-red-500 text-white text-lg">Sold Out</Badge>
                      </div>
                    )}
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
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {(listing.seller_name || 'U').charAt(0)}
                          </div>
                        )}
                        <span className="ml-2 text-sm text-gray-700">{listing.seller_name || 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-lg font-bold text-gray-900">₹{listing.price.toLocaleString('en-IN')}</div>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin size={14} className="mr-1" aria-label="Location" />
                        {listing.location}
                      </div>
                    </div>
                    {listing.average_rating && listing.average_rating > 0 && (
                      <StarRatingDisplay
                        rating={listing.average_rating}
                        reviewCount={listing.review_count}
                        size="sm"
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Marketplace;
