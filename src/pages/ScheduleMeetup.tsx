import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Navigation from '@/components/Navigation';
import { useToast } from '@/components/ui/use-toast';
import { CalendarDays } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface Listing {
  id: string;
  title: string;
}

const ScheduleMeetup = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const preselectedListingId = params.get('listingId');
  const [listings, setListings] = React.useState<Listing[]>([]);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const form = useForm({
    defaultValues: {
      listing_id: preselectedListingId || '',
      scheduled_time: '',
      location: '',
      notes: '',
    },
  });

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserId(null);
        setListings([]);
        setLoading(false);
        return;
      }
      setUserId(user.id);
      // Fetch all listings
      const { data: allListings } = await supabase
        .from('listings')
        .select('id, title');
      setListings(allListings || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const onSubmit = async (values: any) => {
    if (!userId) {
      toast({ title: 'Authentication Required', description: 'You must be signed in to schedule a meetup.', variant: 'destructive' });
      return;
    }
    // Get the selected listing to find seller_id
    const selectedListing = listings.find(l => l.id === values.listing_id);
    if (!selectedListing) {
      toast({ title: 'Error', description: 'Please select a listing.' });
      return;
    }
    // Fetch full listing to get seller_id
    const { data: listingData } = await supabase
      .from('listings')
      .select('seller_id')
      .eq('id', values.listing_id)
      .single();
    if (!listingData) {
      toast({ title: 'Error', description: 'Listing not found.' });
      return;
    }
    const { error } = await supabase.from('meetups').insert({
      listing_id: values.listing_id,
      buyer_id: userId,
      seller_id: listingData.seller_id,
      scheduled_time: values.scheduled_time,
      location: values.location,
      notes: values.notes,
      status: 'pending',
    });
    if (error) {
      if (error.code === '23505') {
        toast({
          title: 'Duplicate Meetup',
          description: 'You have already scheduled a meetup for this listing. Please check your meetups or choose a different time.',
          variant: 'destructive'
        });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    } else {
      toast({ title: 'Meetup Scheduled', description: 'Your meetup has been scheduled.' });
      form.reset();
      navigate('/meetups');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <Navigation />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <CalendarDays className="text-blue-600 dark:text-blue-400" size={32} />
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Schedule a Meetup</h1>
        </div>
        <Card className="shadow-xl border-0 bg-white/90 dark:bg-gray-900/80 backdrop-blur">
          <CardContent className="p-8">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block font-semibold mb-2 text-gray-800 dark:text-gray-200">Listing</label>
                <select
                  className="w-full border-2 border-blue-200 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400"
                  {...form.register('listing_id', { required: true })}
                  disabled={loading}
                >
                  <option value="">Select a listing</option>
                  {listings.map(listing => (
                    <option key={listing.id} value={listing.id}>{listing.title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-semibold mb-2 text-gray-800 dark:text-gray-200">Date & Time</label>
                  <Input
                    type="datetime-local"
                    className="w-full border-2 border-blue-200 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400"
                    {...form.register('scheduled_time', { required: true })}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2 text-gray-800 dark:text-gray-200">Location</label>
                  <Input
                    placeholder="Enter location"
                    className="w-full border-2 border-blue-200 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400"
                    {...form.register('location', { required: true })}
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-2 text-gray-800 dark:text-gray-200">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                <Textarea
                  placeholder="Add any notes for the meetup"
                  className="w-full border-2 border-blue-200 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400"
                  {...form.register('notes')}
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 rounded-lg text-lg shadow-lg flex items-center justify-center gap-2">
                <CalendarDays size={20} /> Schedule Meetup
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScheduleMeetup; 