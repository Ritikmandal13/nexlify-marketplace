import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/lib/supabaseClient';
import Navigation from '@/components/Navigation';
import { useToast } from '@/components/ui/use-toast';
import { CalendarDays, MapPin, StickyNote, Clock, User2, CheckCircle, XCircle, Loader2, Image as ImageIcon, ArrowRight, IndianRupee, Check, Send } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

interface Listing {
  id: string;
  title: string;
  images?: string[];
  price?: number;
  location?: string;
}

interface Meetup {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  scheduled_time: string;
  location: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
  payment_status?: string;
  payment_amount?: number;
  payment_requested_at?: string;
  payment_paid_at?: string;
  listing?: Listing;
}

interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  upi_id?: string;
}

const MeetupScheduler = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const preselectedListingId = params.get('listingId');
  const [listings, setListings] = useState<Listing[]>([]);
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [otherProfiles, setOtherProfiles] = useState<Record<string, Profile>>({});
  const [profileMap, setProfileMap] = useState<Record<string, Profile>>({});
  const [confirmPayDialog, setConfirmPayDialog] = useState<string | null>(null);
  const form = useForm({
    defaultValues: {
      listing_id: preselectedListingId || '',
      scheduled_time: '',
      location: '',
      notes: '',
    },
  });

  // Fetch user, listings, and meetups
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserId(null);
        setListings([]);
        setMeetups([]);
        setOtherProfiles({});
        setProfileMap({});
        setLoading(false);
        return;
      }
      setUserId(user.id);
      // Fetch listings where user is the seller
      const { data: myListings } = await supabase
        .from('listings')
        .select('id, title, images, price, location')
        .eq('seller_id', user.id);
      setListings(myListings || []);
      // Fetch meetups where user is buyer or seller, include listing images
      const { data: myMeetups } = await supabase
        .from('meetups')
        .select('*, listing:listing_id(id, title, images, price, location)')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('scheduled_time', { ascending: false });
      setMeetups(myMeetups || []);
      // Fetch all involved profiles (buyer and seller)
      if (myMeetups && myMeetups.length > 0) {
        const allPartyIds = Array.from(new Set(myMeetups.flatMap(m => [m.buyer_id, m.seller_id])));
        if (allPartyIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, upi_id')
            .in('id', allPartyIds);
          const profilesMap: Record<string, Profile> = {};
          profilesData?.forEach((p: Profile) => { profilesMap[p.id] = p; });
          setProfileMap(profilesMap);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Handle form submit
  const onSubmit = async (values: any) => {
    if (!userId) return;
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
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Meetup Scheduled', description: 'Your meetup has been scheduled.' });
      form.reset();
      // Refresh meetups
      setLoading(true);
      const { data: myMeetups } = await supabase
        .from('meetups')
        .select('*, listing:listing_id(id, title, images, price, location)')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('scheduled_time', { ascending: false });
      setMeetups(myMeetups || []);
      setLoading(false);
    }
  };

  // Add this helper to update status
  const updateMeetupStatus = async (meetupId: string, newStatus: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('meetups')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', meetupId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Status Updated', description: `Meetup marked as ${newStatus}.` });
      // Refresh meetups
      const { data: myMeetups } = await supabase
        .from('meetups')
        .select('*, listing:listing_id(id, title, images, price, location)')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('scheduled_time', { ascending: false });
      setMeetups(myMeetups || []);
    }
    setLoading(false);
  };

  // Payment actions
  const requestPayment = async (meetup: Meetup) => {
    if (!meetup.id) return;
    const amount = meetup.listing?.price || 0;
    setLoading(true);
    const { error } = await supabase
      .from('meetups')
      .update({
        payment_status: 'requested',
        payment_amount: amount,
        payment_requested_at: new Date().toISOString(),
      })
      .eq('id', meetup.id);
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Payment Requested', description: 'Payment request sent to buyer.' });
      // Refresh meetups
      const { data: myMeetups } = await supabase
        .from('meetups')
        .select('*, listing:listing_id(id, title, images, price, location)')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('scheduled_time', { ascending: false });
      setMeetups(myMeetups || []);
    }
  };

  const markAsPaid = async (meetup: Meetup) => {
    if (!meetup.id) return;
    setLoading(true);
    const { error } = await supabase
      .from('meetups')
      .update({
        payment_status: 'paid',
        payment_paid_at: new Date().toISOString(),
      })
      .eq('id', meetup.id);
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Marked as Paid', description: 'Payment marked as paid.' });
      // Refresh meetups
      const { data: myMeetups } = await supabase
        .from('meetups')
        .select('*, listing:listing_id(id, title, images, price, location)')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('scheduled_time', { ascending: false });
      setMeetups(myMeetups || []);
    }
  };

  const getUpiDeepLink = (upiId: string, amount: number, note: string) => {
    // UPI deep link format
    return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(note)}&am=${amount}&cu=INR`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <CalendarDays className="text-blue-600 dark:text-blue-400" size={32} />
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Your Meetups</h1>
        </div>
        {/* Meetups List */}
        {loading ? (
          <div className="flex flex-col items-center py-16 text-blue-500 dark:text-blue-300">
            <Loader2 className="animate-spin mb-2" size={32} />
            <span className="font-semibold">Loading...</span>
          </div>
        ) : meetups.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400 dark:text-gray-500">
            <XCircle size={40} className="mb-2" />
            <span className="font-semibold">No meetups scheduled yet.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {meetups.map(meetup => {
              const isSeller = userId === meetup.seller_id;
              const isBuyer = userId === meetup.buyer_id;
              const scheduledDate = new Date(meetup.scheduled_time);
              const now = new Date();
              const statusColor =
                meetup.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                meetup.status === 'accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                meetup.status === 'declined' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                meetup.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                meetup.status === 'cancelled' ? 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
              // Show the other party's info
              const otherPartyId = isSeller ? meetup.buyer_id : meetup.seller_id;
              const otherProfile: Profile = otherProfiles[otherPartyId] || { id: '', full_name: '', avatar_url: '' };
              return (
                <Card key={meetup.id} className="shadow-xl border-0 bg-white/95 dark:bg-gray-900/90 backdrop-blur-lg hover:scale-[1.01] hover:shadow-2xl transition-transform cursor-pointer group">
                  <CardContent className="p-0 flex flex-col md:flex-row items-stretch">
                    {/* Product Image */}
                    <div className="flex-shrink-0 w-full md:w-40 h-40 md:h-auto flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-t-lg md:rounded-l-lg md:rounded-tr-none overflow-hidden">
                      {meetup.listing?.images?.length > 0 ? (
                        <img
                          src={meetup.listing.images[0]}
                          alt={meetup.listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full text-gray-400">
                          <ImageIcon size={40} />
                          <span className="text-xs mt-1">No Image</span>
                        </div>
                      )}
                    </div>
                    {/* Details */}
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-1">{meetup.listing?.title || 'Listing'}</span>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ml-2 ${statusColor}`}>
                              {meetup.status === 'accepted' && <CheckCircle size={16} className="mr-1" />}
                              {meetup.status === 'declined' && <XCircle size={16} className="mr-1" />}
                              {meetup.status.charAt(0).toUpperCase() + meetup.status.slice(1)}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900"
                            onClick={() => navigate(`/listing/${meetup.listing?.id}`)}
                            title="View Listing"
                          >
                            <ArrowRight size={20} />
                          </Button>
                        </div>
                        {meetup.listing?.price && (
                          <div className="text-xl font-bold text-blue-600 mb-1">₹{meetup.listing.price.toLocaleString('en-IN')}</div>
                        )}
                        {meetup.listing?.location && (
                          <div className="flex items-center text-gray-600 dark:text-gray-300 mb-2">
                            <MapPin size={16} className="mr-1" />
                            <span>{meetup.listing.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-1">
                          <Clock size={16} />
                          <span>{scheduledDate.toLocaleString()}</span>
                        </div>
                        {meetup.notes && (
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-2 text-sm">
                            <StickyNote size={16} />
                            <span>Notes: {meetup.notes}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 mt-2">
                        {/* Payment status and actions */}
                        {meetup.payment_status === 'paid' ? (
                          <div className="flex items-center gap-2 text-green-600 font-semibold">
                            <Check size={18} /> Paid
                          </div>
                        ) : meetup.payment_status === 'requested' ? (
                          isBuyer ? (
                            <>
                              <div className="flex items-center gap-2 text-blue-600 font-semibold">
                                <IndianRupee size={18} />
                                Pay ₹{meetup.payment_amount} to {profileMap[meetup.seller_id]?.upi_id || 'Seller'}
                              </div>
                              {profileMap[meetup.seller_id]?.upi_id && (
                                <Button
                                  size="sm"
                                  className="bg-gradient-to-r from-blue-500 to-green-600 text-white font-semibold shadow"
                                  onClick={() => window.open(getUpiDeepLink(profileMap[meetup.seller_id]?.upi_id!, meetup.payment_amount || 0, meetup.listing?.title || 'Nexlify Payment'), '_blank')}
                                >
                                  Pay Now
                                </Button>
                              )}
                              <AlertDialog open={confirmPayDialog === meetup.id} onOpenChange={open => setConfirmPayDialog(open ? meetup.id : null)}>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="font-semibold shadow"
                                  >
                                    Mark as Paid
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Mark as Paid?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you have completed the UPI payment to the seller? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => { markAsPaid(meetup); setConfirmPayDialog(null); }}>Yes, I have paid</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-yellow-600 font-semibold">
                              <Send size={18} /> Payment Requested
                            </div>
                          )
                        ) : (
                          isSeller && meetup.status === 'accepted' && (
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold shadow"
                              onClick={() => requestPayment(meetup)}
                              disabled={meetup.payment_status === 'requested' || meetup.payment_status === 'paid'}
                            >
                              Request Payment
                            </Button>
                          )
                        )}
                        {/* Show payment amount if set */}
                        {meetup.payment_amount && (
                          <div className="text-xs text-gray-500">Amount: ₹{meetup.payment_amount}</div>
                        )}
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-4 gap-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          {otherProfile.avatar_url ? (
                            <img src={otherProfile.avatar_url} alt={otherProfile.full_name || 'User'} className="w-7 h-7 rounded-full object-cover border border-gray-300 dark:border-gray-700" />
                          ) : (
                            <User2 size={20} className="text-gray-400" />
                          )}
                          <span>{otherProfile.full_name || 'Other party'}</span>
                        </div>
                        <div className="flex flex-row gap-2 mt-2 md:mt-0">
                          {/* Seller actions for pending */}
                          {isSeller && meetup.status === 'pending' && (
                            <>
                              <Button size="sm" className="bg-gradient-to-r from-green-500 to-green-700 text-white font-semibold shadow" onClick={() => updateMeetupStatus(meetup.id, 'accepted')}>Accept</Button>
                              <Button size="sm" variant="destructive" className="font-semibold shadow" onClick={() => updateMeetupStatus(meetup.id, 'declined')}>Decline</Button>
                            </>
                          )}
                          {/* Buyer or seller can cancel if pending or accepted */}
                          {(isSeller || isBuyer) && (meetup.status === 'pending' || meetup.status === 'accepted') && (
                            <Button size="sm" variant="outline" className="font-semibold shadow" onClick={() => updateMeetupStatus(meetup.id, 'cancelled')}>Cancel</Button>
                          )}
                          {/* Mark as completed if accepted and time has passed */}
                          {(isSeller || isBuyer) && meetup.status === 'accepted' && scheduledDate < now && (
                            <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold shadow" onClick={() => updateMeetupStatus(meetup.id, 'completed')}>Mark as Completed</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetupScheduler; 