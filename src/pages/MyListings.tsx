import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Edit, Trash2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';

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

const MyListings = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyListings = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setListings([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        setListings([]);
      } else {
        setListings(data || []);
      }
      setLoading(false);
    };
    fetchMyListings();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">My Listings</h1>
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">You have not created any listings yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <Card key={listing.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <div className="relative">
                  <img
                    src={listing.images[0] || '/placeholder.svg'}
                    alt={listing.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
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
                      ₹{listing.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {listing.description}
                  </p>
                  <div className="flex items-center text-gray-600 text-sm mb-3">
                    <MapPin size={14} className="mr-1" />
                    <span>{listing.location}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => navigate(`/edit-listing/${listing.id}`)}
                    >
                      <Edit size={16} className="mr-2" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => navigate(`/listing/${listing.id}`)}
                    >
                      <Trash2 size={16} className="mr-2" /> View
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

export default MyListings; 