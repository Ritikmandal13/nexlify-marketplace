import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Star, Heart, MessageCircle, Share } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
  created_at: string;
  status?: string;
}

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [listing, setListing] = useState<Listing | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      const { data, error } = await supabase.from('listings').select('*').eq('id', id).single();
      if (error) {
        setListing(null);
      } else {
        setListing(data);
      }
    };
    fetchListing();
  }, [id]);

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Listing not found</h2>
          <Button onClick={() => navigate('/marketplace')}>
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const handleMessageSeller = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to contact the seller.',
        variant: 'destructive',
      });
      return;
    }
    if (!listing) return;
    // Check if a chat already exists between these two users for this product
    const { data: existingChats, error } = await supabase
      .from('chats')
      .select('*')
      .contains('user_ids', [user.id, listing.seller_id])
      .eq('product_id', listing.id);
    let chatId;
    if (existingChats && existingChats.length > 0) {
      chatId = existingChats[0].id;
    } else {
      // Create a new chat with product context
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({ 
          user_ids: [user.id, listing.seller_id],
          product_id: listing.id
        })
        .select()
        .single();
      if (chatError || !newChat) {
        toast({
          title: 'Error',
          description: 'Could not start chat.',
          variant: 'destructive',
        });
        return;
      }
      chatId = newChat.id;
    }
    navigate(`/chat/${chatId}`);
  };

  const handleAddToFavorites = () => {
    toast({
      title: "Added to favorites",
      description: "This item has been saved to your favorites.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold">Item Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div>
            <div className="relative mb-4">
              <img
                src={listing.images[currentImageIndex] || '/placeholder.svg'}
                alt={listing.title}
                className="w-full h-96 object-cover rounded-lg"
              />
              {listing.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {listing.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-3 h-3 rounded-full ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {listing.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {listing.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${listing.title} ${index + 1}`}
                    className={`h-20 object-cover rounded cursor-pointer ${
                      index === currentImageIndex ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Item Details */}
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
                <div className="flex items-center space-x-3 mb-4">
                  <Badge className="bg-green-500 text-white capitalize">
                    {listing.condition}
                  </Badge>
                  <Badge variant="secondary" className="capitalize">
                    {listing.category}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">₹{listing.price.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div className="flex items-center text-gray-600 mb-6">
              <MapPin size={16} className="mr-2" />
              <span>{listing.location}</span>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">{listing.description}</p>
            </div>

            {/* Seller Info */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-3">Seller Information</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-medium">
                      {(listing.seller_name || 'U').charAt(0)}
                    </div>
                    <div className="ml-3">
                      <div className="font-medium">{listing.seller_name || 'Unknown'}</div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Star size={14} className="text-yellow-400 fill-current mr-1" />
                        4.8 (23 reviews)
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handleMessageSeller} 
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <MessageCircle size={16} className="mr-2" />
                Message Seller
              </Button>
              
              <div className="flex space-x-3">
                <Button
                  onClick={handleAddToFavorites}
                  variant="outline"
                  className="flex-1"
                >
                  <Heart size={16} className="mr-2" />
                  Save
                </Button>
                <Button variant="outline" className="flex-1">
                  <Share size={16} className="mr-2" />
                  Share
                </Button>
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-500">
              Posted {new Date(listing.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
