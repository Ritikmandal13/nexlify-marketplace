
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Camera, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ListingFormData {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  location: string;
}

const CreateListing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages = Array.from(files).slice(0, 5 - selectedImages.length);
      setSelectedImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: ListingFormData) => {
    const user = localStorage.getItem('nexlify-user');
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a listing.",
        variant: "destructive"
      });
      return;
    }

    const userData = JSON.parse(user);
    const listing = {
      id: Date.now().toString(),
      ...data,
      images: selectedImages.map(file => URL.createObjectURL(file)),
      sellerId: userData.id,
      sellerName: userData.name,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    // Save to localStorage (in real app, this would go to a backend)
    const existingListings = JSON.parse(localStorage.getItem('nexlify-listings') || '[]');
    localStorage.setItem('nexlify-listings', JSON.stringify([...existingListings, listing]));

    toast({
      title: "Listing Created!",
      description: "Your item has been listed successfully.",
    });

    navigate('/');
  };

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
          <h1 className="text-2xl font-bold">Create New Listing</h1>
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
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-3 text-gray-400" size={16} />
                            <Input 
                              type="number" 
                              placeholder="0.00"
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
                </div>

                <div className="flex space-x-4">
                  <Button type="submit" className="flex-1">
                    Create Listing
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

export default CreateListing;
