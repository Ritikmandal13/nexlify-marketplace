import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Camera, MapPin, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { PriceSuggestion } from '@/components/PriceSuggestion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
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

interface ListingFormData {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  location: string;
  latitude?: number;
  longitude?: number;
}

const CreateListing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showLocationPermissionDialog, setShowLocationPermissionDialog] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);

  const form = useForm<ListingFormData>({
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      category: '',
      condition: 'good',
      location: '',
      latitude: undefined,
      longitude: undefined,
    },
    shouldUnregister: false,
  });

  const categories = [
    'Textbooks',
    'Electronics',
    'Furniture',
    'Clothing',
    'Sports Equipment',
    'Music Instruments',
    'Other'
  ];

  const conditions = [
    'Like New',
    'Excellent',
    'Good',
    'Fair',
    'Poor'
  ];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages = Array.from(files).slice(0, 5 - selectedImages.length);
      // Validate each file
      const validImages = newImages.filter(file => {
        // Check if file is an image
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid file type",
            description: "Please upload only image files.",
            variant: "destructive"
          });
          return false;
        }
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: "Image size should be less than 5MB.",
            variant: "destructive"
          });
          return false;
        }
        return true;
      });
      setSelectedImages(prev => [...prev, ...validImages]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Helper to upload a single image to Supabase Storage
  const uploadImageToSupabase = async (file: File, userId: string) => {
    try {
      // Ensure file has a valid extension
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      
      if (!validExtensions.includes(fileExt)) {
        throw new Error('Invalid file type. Please upload JPG, PNG, GIF, or WebP images.');
      }

      // Create a unique file path
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const filePath = `${userId}/${timestamp}-${randomString}.${fileExt}`;

      // Upload to Supabase Storage with proper content type
      const { data, error } = await supabase.storage
        .from('listing-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(error.message);
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('listing-images')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      throw new Error(error.message || 'Failed to upload image');
    }
  };

  const requestLocationPermission = async () => {
    try {
      // First check if we're in a PWA context
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                   (window.navigator as any).standalone || 
                   document.referrer.includes('android-app://');
      
      if (isPWA) {
        // Show our custom permission dialog first
        setShowLocationPermissionDialog(true);
      } else {
        // In browser context, directly request location
        getCurrentLocation();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to request location permission.",
        variant: "destructive"
      });
    }
  };

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    setShowLocationPermissionDialog(false);

    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive"
      });
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          console.log('Geolocation API returned:', latitude, longitude);
          // If the coordinates are still the default (e.g., Delhi), show an error
          if (
            (latitude === 28.7041 && longitude === 77.1025) ||
            !latitude || !longitude
          ) {
            toast({
              title: "Location Error",
              description: "Could not fetch your real location. Please check your device settings and try again.",
              variant: "destructive"
            });
            setIsGettingLocation(false);
            return;
          }
          // Reverse geocode to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const address = data.display_name;
          setSelectedLocation({ lat: latitude, lng: longitude, address });
          form.setValue('latitude', latitude);
          form.setValue('longitude', longitude);
          form.setValue('location', address || '');
          setShowLocationDialog(true); // Open the map dialog after location is fetched
          toast({
            title: "Location Set",
            description: "Your current location has been set successfully.",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to get location details. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        let errorMessage = "Failed to get your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Please allow location access to set your location.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Try again, or check your device's location settings.";
            break;
        }
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const onSubmit = async (data: ListingFormData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a listing.",
        variant: "destructive"
      });
      return;
    }
    setUploading(true);
    try {
      // Get user's profile to get avatar URL
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      }

      // Upload all images to Supabase Storage
      const imageUrls: string[] = [];
      for (const file of selectedImages) {
        const url = await uploadImageToSupabase(file, user.id);
        imageUrls.push(url);
      }

      // Insert listing into Supabase
      const listingData = {
        title: data.title,
        description: data.description,
        price: data.price,
        category: data.category,
        condition: data.condition,
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
        images: imageUrls,
        seller_id: user.id,
        seller_name: user.user_metadata?.full_name || user.email,
        seller_email: user.email,
        seller_avatar_url: userProfile?.avatar_url || null,
        status: 'active', // ✅ Set status to active
      };

      const { error } = await supabase.from('listings').insert(listingData);
      if (error) throw error;
      toast({
        title: "Listing Created!",
        description: "Your item has been listed successfully.",
      });
      navigate('/marketplace');
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create listing.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  let bbox = '';
  if (selectedLocation) {
    const delta = 0.005;
    bbox = [
      selectedLocation.lng - delta,
      selectedLocation.lat - delta,
      selectedLocation.lng + delta,
      selectedLocation.lat + delta
    ].join(',');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2" /> Back
        </Button>
        <Card className="shadow-xl border-0 bg-white/95 dark:bg-gray-900/90 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Create New Listing</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form} key="create-listing-form">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">Photos (up to 5)</label>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {selectedImages.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0"
                          onClick={() => removeImage(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                    {selectedImages.length < 5 && (
                      <label className="border-2 border-dashed border-gray-300 rounded-lg h-24 flex items-center justify-center cursor-pointer hover:border-blue-500">
                        <Camera className="text-gray-400" size={24} />
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  rules={{ required: "Title is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="What are you selling?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  rules={{ required: "Description is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your item..." 
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    rules={{ 
                      required: "Price is required",
                      min: { value: 0, message: "Price must be positive" }
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (INR)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-400 font-bold">₹</span>
                            <Input 
                              type="number" 
                              placeholder="0"
                              className="pl-8"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    rules={{ required: "Category is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <select 
                            className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md"
                            {...field}
                          >
                            <option value="">Select category</option>
                            {categories.map(cat => (
                              <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* AI Price Suggestion */}
                <PriceSuggestion
                  title={form.watch('title')}
                  description={form.watch('description')}
                  category={form.watch('category')}
                  condition={form.watch('condition')}
                  currentPrice={form.watch('price')}
                  onPriceSelect={(price) => form.setValue('price', price)}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition</FormLabel>
                        <FormControl>
                          <select 
                            className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md"
                            {...field}
                          >
                            {conditions.map(condition => (
                              <option key={condition} value={condition.toLowerCase()}>{condition}</option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                          <FormControl className="flex-1">
                            <Input
                              {...field}
                              placeholder="Select a location"
                              readOnly
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <div className="w-full sm:w-auto">
                            <Button
                              type="button"
                              variant="outline"
                              className="flex items-center gap-2 w-full sm:w-auto"
                              onClick={requestLocationPermission}
                              disabled={isGettingLocation}
                            >
                              {isGettingLocation ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Getting Location...
                                </>
                              ) : (
                                <>
                                  <MapPin size={16} />
                                  Use Current Location
                                </>
                              )}
                            </Button>
                            <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
                              <DialogContent className="sm:max-w-[600px] h-[500px] p-0">
                                <DialogHeader className="p-4">
                                  <DialogTitle>Your Location</DialogTitle>
                                  <DialogDescription>
                                    This map shows your current location as detected by your device. Confirm if this is correct before saving your listing.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="w-full h-[400px] flex flex-col items-center justify-center">
                                  {selectedLocation ? (
                                    <>
                                      <iframe
                                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${selectedLocation.lat},${selectedLocation.lng}`}
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        allowFullScreen
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                      ></iframe>
                                      <div className="mt-2 text-xs text-gray-500">
                                        <div>Latitude: {selectedLocation.lat}</div>
                                        <div>Longitude: {selectedLocation.lng}</div>
                                      </div>
                                    </>
                                  ) : (
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                  )}
                                </div>
                                <div className="p-4 border-t">
                                  <p className="text-sm text-gray-500 mb-2">
                                    Your current location will be used for this listing
                                  </p>
                                  <Button
                                    type="button"
                                    onClick={() => setShowLocationDialog(false)}
                                    className="w-full"
                                  >
                                    Close
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" placeholder="e.g. 28.6139" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" placeholder="e.g. 77.2090" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-4">
                  <Button type="submit" className="flex-1" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Create Listing'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Location Permission Dialog */}
      <AlertDialog open={showLocationPermissionDialog} onOpenChange={setShowLocationPermissionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Allow Location Access</AlertDialogTitle>
            <AlertDialogDescription>
              SmartThrift needs access to your location to help buyers find your listing. 
              This will only be used when you explicitly set a location for your listing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={getCurrentLocation}>
              Allow Location
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CreateListing;
