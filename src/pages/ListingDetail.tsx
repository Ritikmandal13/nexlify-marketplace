import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Star, Heart, MessageCircle, Share, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  location: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  seller_id: string;
  seller_name: string;
  seller_avatar_url?: string;
  created_at: string;
  status?: string;
}

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [listing, setListing] = useState<Listing | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<{ rating: number }[]>([]);

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      setIsLoading(true);
      const { data, error } = await supabase
        .from('listings')
        .select('*, latitude, longitude')
        .eq('id', id)
        .single();
      if (error) {
        setListing(null);
      } else {
        setListing(data);
        // Check if current user is the owner
        const { data: { user } } = await supabase.auth.getUser();
        setIsOwner(user?.id === data.seller_id);
      }
      setIsLoading(false);
    };
    fetchListing();
    // Fetch seller reviews
    const fetchReviews = async () => {
      if (!id) return;
      // Wait for listing to load
      const { data: listingData } = await supabase.from('listings').select('seller_id').eq('id', id).single();
      if (!listingData) return;
      const { data: reviewData } = await supabase
        .from('reviews')
        .select('rating')
        .eq('seller_id', listingData.seller_id);
      setReviews(reviewData || []);
    };
    fetchReviews();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl text-gray-600">Loading listing details...</h2>
        </div>
      </div>
    );
  }

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
    if (!user?.id || !listing?.seller_id) {
      toast({
        title: 'Error',
        description: 'User or seller information is missing.',
        variant: 'destructive',
      });
      return;
    }
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
    // Only navigate if chatId is valid
    if (!chatId) {
      toast({
        title: 'Error',
        description: 'Could not find or create chat.',
        variant: 'destructive',
      });
      return;
    }
    navigate(`/chat/${chatId}`);
  };

  const handleAddToFavorites = () => {
    toast({
      title: "Added to favorites",
      description: "This item has been saved to your favorites.",
    });
  };

  const handleDelete = async () => {
    if (!listing) return;

    try {
      // Delete related chats first
      const { error: chatError } = await supabase
        .from('chats')
        .delete()
        .eq('product_id', listing.id);

      if (chatError) throw chatError;

      // Delete images from storage
      for (const imageUrl of listing.images) {
        const path = imageUrl.split('/').pop();
        if (path) {
          await supabase.storage.from('listing-images').remove([path]);
        }
      }

      // Delete the listing
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listing.id);

      if (error) throw error;

      toast({
        title: "Listing Deleted",
        description: "Your listing and related chats have been deleted.",
      });
      navigate('/marketplace');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete listing.",
        variant: "destructive"
      });
    }
  };

  // Calculate average rating and review count
  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0 ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount).toFixed(1) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2" /> Back
        </Button>
        
        {listing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left column - Images */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={listing.images[currentImageIndex]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {listing.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {listing.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative aspect-square rounded-lg overflow-hidden ${
                        currentImageIndex === index ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${listing.title} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right column - Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {listing.title}
                </h1>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ₹{listing.price.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <MapPin size={16} />
                <span>{listing.location}</span>
                {listing.latitude && listing.longitude && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-2 text-blue-600 border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900"
                    onClick={() => {
                      const url =
                        /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)
                          ? `http://maps.apple.com/?daddr=${listing.latitude},${listing.longitude}`
                          : `https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`;
                      window.open(url, '_blank');
                    }}
                    title="Open in Maps"
                  >
                    <MapPin size={16} className="mr-1" /> Go to Location
                  </Button>
                )}
              </div>

              <div className="flex items-center text-gray-600 mb-6">
                <Badge className="bg-green-500 text-white capitalize">
                  {listing.condition}
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  {listing.category}
                </Badge>
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
                      {listing.seller_avatar_url ? (
                        <img
                          src={
                            listing.seller_avatar_url.startsWith('http')
                              ? listing.seller_avatar_url
                              : `https://spjvuhlgitqnthcvnpyb.supabase.co/storage/v1/object/public/avatars/${listing.seller_avatar_url}`
                          }
                          alt={listing.seller_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-medium">
                          {(listing.seller_name || 'U').charAt(0)}
                        </div>
                      )}
                      <div className="ml-3">
                        <div className="font-medium">{listing.seller_name || 'Unknown'}</div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Star size={14} className="text-yellow-400 fill-current mr-1" />
                          {averageRating ? (
                            <>
                              {averageRating} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
                            </>
                          ) : (
                            <>No reviews yet</>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-4">
                {isOwner ? (
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => navigate(`/edit-listing/${listing.id}`)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      size="lg"
                    >
                      <Edit size={16} className="mr-2" />
                      Edit Listing
                    </Button>
                    <Button
                      onClick={() => setShowDeleteDialog(true)}
                      variant="destructive"
                      className="flex-1"
                      size="lg"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete Listing
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button 
                      onClick={handleMessageSeller} 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="lg"
                    >
                      <MessageCircle size={16} className="mr-2" />
                      Message Seller
                    </Button>
                    <Button
                      onClick={() => navigate(`/meetups/schedule?listingId=${listing.id}`)}
                      className="w-full bg-green-600 hover:bg-green-700 mt-2"
                      size="lg"
                    >
                      🤝 Schedule Meetup
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
                  </>
                )}
              </div>

              <div className="mt-6 text-sm text-gray-500">
                Posted {new Date(listing.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your listing
              and remove all associated images.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ListingDetail;
