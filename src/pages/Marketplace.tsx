
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Plus, MapPin, Star, Heart } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  location: string;
  images: string[];
  sellerId: string;
  sellerName: string;
  createdAt: string;
  status: string;
}

const Marketplace = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);

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
    // Load listings from localStorage
    const savedListings = JSON.parse(localStorage.getItem('nexlify-listings') || '[]');
    setListings(savedListings);
  }, []);

  useEffect(() => {
    // Filter listings based on search and category
    let filtered = listings;

    if (searchTerm) {
      filtered = filtered.filter(listing =>
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(listing =>
        listing.category === selectedCategory
      );
    }

    setFilteredListings(filtered);
  }, [listings, searchTerm, selectedCategory]);

  const handleCreateListing = () => {
    const user = localStorage.getItem('nexlify-user');
    if (!user) {
      // Show auth modal or redirect to sign in
      return;
    }
    navigate('/create-listing');
  };

  return (
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
        {filteredListings.length === 0 ? (
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
              <Card key={listing.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <div className="relative">
                  <img
                    src={listing.images[0] || '/placeholder.svg'}
                    alt={listing.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                  >
                    <Heart size={16} />
                  </Button>
                  <Badge className="absolute top-2 left-2 bg-green-500 text-white capitalize">
                    {listing.condition}
                  </Badge>
                </div>

                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 truncate flex-1 mr-2">
                      {listing.title}
                    </h3>
                    <span className="text-xl font-bold text-blue-600">
                      ${listing.price}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {listing.description}
                  </p>

                  <div className="flex items-center text-gray-600 text-sm mb-3">
                    <MapPin size={14} className="mr-1" />
                    <span>{listing.location}</span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {listing.sellerName.charAt(0)}
                      </div>
                      <span className="ml-2 text-sm text-gray-700">{listing.sellerName}</span>
                    </div>
                    <div className="flex items-center">
                      <Star size={14} className="text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm text-gray-600">4.8</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {listing.category}
                    </Badge>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm"
                      onClick={() => navigate(`/listing/${listing.id}`)}
                    >
                      View Details
                    </Button>
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

export default Marketplace;
