import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Camera, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { PriceSuggestion } from '@/components/PriceSuggestion';

interface ListingFormData {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  location: string;
}

interface Listing extends ListingFormData {
  id: string;
  images: string[];
  seller_id: string;
  seller_name: string;
  seller_avatar_url?: string;
  created_at: string;
}

const EditListing = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [listing, setListing] = useState<Listing | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const form = useForm<ListingFormData>({
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      category: '',
      condition: 'good',
      location: ''
    }
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

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      const { data, error } = await supabase.from('listings').select('*').eq('id', id).single();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch listing details.",
          variant: "destructive"
        });
        navigate('/marketplace');
        return;
      }

      setListing(data);
      setExistingImages(data.images || []);
      form.reset({
        title: data.title,
        description: data.description,
        price: data.price,
        category: data.category,
        condition: data.condition,
        location: data.location
      });
    };
    fetchListing();
  }, [id, form, navigate, toast]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const totalImages = existingImages.length + newImages.length;
      const remainingSlots = 5 - totalImages;
      const newFiles = Array.from(files).slice(0, remainingSlots);
      setNewImages(prev => [...prev, ...newFiles]);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImageToSupabase = async (file: File, userId: string) => {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const { data, error } = await supabase.storage.from('listing-images').upload(filePath, file);
    if (error) throw error;
    const { data: publicUrlData } = supabase.storage.from('listing-images').getPublicUrl(filePath);
    return publicUrlData.publicUrl;
  };

  const onSubmit = async (data: ListingFormData) => {
    if (!listing) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== listing.seller_id) {
      toast({
        title: "Unauthorized",
        description: "You can only edit your own listings.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // Upload new images
      const newImageUrls: string[] = [];
      for (const file of newImages) {
        const url = await uploadImageToSupabase(file, user.id);
        newImageUrls.push(url);
      }

      // Combine existing and new image URLs
      const allImages = [...existingImages, ...newImageUrls];

      // Update listing in Supabase
      const { error } = await supabase
        .from('listings')
        .update({
          title: data.title,
          description: data.description,
          price: data.price,
          category: data.category,
          condition: data.condition,
          location: data.location,
          images: allImages
        })
        .eq('id', listing.id);

      if (error) throw error;

      toast({
        title: "Listing Updated",
        description: "Your listing has been successfully updated.",
      });
      navigate(`/listing/${listing.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update listing.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold">Edit Listing</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">Photos (up to 5)</label>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {/* Existing Images */}
                    {existingImages.map((imageUrl, index) => (
                      <div key={`existing-${index}`} className="relative">
                        <img
                          src={imageUrl}
                          alt={`Existing ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0"
                          onClick={() => removeExistingImage(index)}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ))}
                    
                    {/* New Images */}
                    {newImages.map((file, index) => (
                      <div key={`new-${index}`} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`New ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0"
                          onClick={() => removeNewImage(index)}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ))}

                    {/* Upload Button */}
                    {(existingImages.length + newImages.length) < 5 && (
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
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  rules={{ required: "Location is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Campus area" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-3">
                  <Button type="submit" className="flex-1" disabled={uploading}>
                    {uploading ? 'Saving...' : 'Save Changes'}
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
    </div>
  );
};

export default EditListing; 