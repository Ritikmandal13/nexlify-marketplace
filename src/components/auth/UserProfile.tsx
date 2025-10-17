import React, { useState, useEffect } from 'react';
import { User as UserIcon, Mail, GraduationCap, Shield, Edit2, Save, X, Image as ImageIcon, Info, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { User, AuthUser } from '@/types/user';
import { useNavigate } from 'react-router-dom';
import { StarRatingDisplay } from '@/components/ui/star-rating';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfile = ({ isOpen, onClose }: UserProfileProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [profilePic, setProfilePic] = useState('');
  const [university, setUniversity] = useState('');
  const [bio, setBio] = useState('');
  const [uploading, setUploading] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [totalEarned, setTotalEarned] = useState<number>(0);
  const [userRating, setUserRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch user ratings
  const fetchUserRating = async (userId: string) => {
    try {
      const { data: ratings } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('user_id', userId);
      
      if (ratings && ratings.length > 0) {
        const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        setUserRating(Number(avgRating.toFixed(1)));
        setReviewCount(ratings.length);
      } else {
        setUserRating(0);
        setReviewCount(0);
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  };

  // Always fetch latest user and profile info when modal opens
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          setUser(authUser as AuthUser);
          fetchUserRating(authUser.id);
          
          // Try to fetch user profile
          const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, university, bio, upi_id')
            .eq('id', authUser.id)
            .single();
          
          if (error) {
            console.error('Error fetching user data:', error);
            
            // If profile doesn't exist, create it
            if (error.code === 'PGRST116') {
              const { error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: authUser.id,
                  full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
                });
              
              if (createError) {
                console.error('Error creating user profile:', createError);
                toast({
                  variant: "destructive",
                  title: "Error",
                  description: "Failed to create user profile",
                });
                return;
              }
              
              // Retry fetching the profile
              const { data: retryData, error: retryError } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, university, bio, upi_id')
                .eq('id', authUser.id)
                .single();
              
              if (retryError) {
                console.error('Error fetching user data after creation:', retryError);
                toast({
                  variant: "destructive",
                  title: "Error",
                  description: "Failed to fetch user data",
                });
                return;
              }
              
              if (retryData) {
                setUserData(retryData);
                setEditName(retryData.full_name || '');
                setProfilePic(retryData.avatar_url || '');
                setUniversity(retryData.university || '');
                setBio(retryData.bio || '');
                setUpiId(retryData.upi_id || '');
              }
            } else {
              toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch user data",
              });
            }
            return;
          }

          if (data) {
            setUserData(data);
            setEditName(data.full_name || '');
            setProfilePic(data.avatar_url || '');
            setUniversity(data.university || '');
            setBio(data.bio || '');
            setUpiId(data.upi_id || '');
          } else {
            setEditName('');
            setProfilePic('');
            setUniversity('');
            setBio('');
            setUpiId('');
          }
        } else {
          setEditName('');
          setProfilePic('');
          setUniversity('');
          setBio('');
          setUpiId('');
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred",
        });
      }
    };
    if (isOpen) fetchUser();
  }, [isOpen, toast]);

  // When displaying the profile, always resolve the public URL from the storage path
  useEffect(() => {
    if (userData && userData.avatar_url) {
      try {
        // Check if the avatar_url is already a full URL
        if (userData.avatar_url.startsWith('http')) {
          setProfilePic(userData.avatar_url);
        } else {
          // If it's just a path, construct the full URL
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(userData.avatar_url);
          setProfilePic(publicUrlData.publicUrl);
        }
      } catch (error) {
        console.error('Error resolving avatar URL:', error);
        // If there's an error, show the default avatar
        setProfilePic('');
      }
    }
  }, [userData]);

  // Fetch total earned money
  useEffect(() => {
    const fetchTotalEarned = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('total_earned')
        .eq('id', user.id)
        .single();
      if (!error && data) {
        setTotalEarned(data.total_earned || 0);
      } else {
        setTotalEarned(0);
      }
    };
    if (isOpen && user) fetchTotalEarned();
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const updates = {
      id: user.id,
      full_name: editName,
      university,
      bio,
    };
    const { error } = await supabase.from('profiles').upsert(updates, { onConflict: 'id' });
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile name",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile name updated successfully",
      });
    }
    setIsEditing(false);
    setSaving(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onClose();
    window.location.reload();
  };

  // Complete Profile Handlers
  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      // Create a clean file name without spaces or special characters
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const cleanFileName = `${user.id}/${timestamp}-${randomString}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(cleanFileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to upload image: " + uploadError.message,
        });
        setUploading(false);
        return;
      }

      // Get the public URL for display
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(cleanFileName);

      // Update the user's profile with just the file path
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: cleanFileName, // Store only the clean file path
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update profile picture",
        });
      } else {
        setProfilePic(publicUrl); // Use the full URL for display
        toast({
          title: "Success",
          description: "Profile picture updated successfully",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCompleteProfileSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updates = {
        id: user.id,
        full_name: editName,
        university,
        bio,
        upi_id: upiId,
      };
      
      console.log('Attempting to update profile with:', updates);
      
      const { error } = await supabase
        .from('profiles')
        .upsert(updates, { 
          onConflict: 'id'
        });

      if (error) {
        console.error('Profile update error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to save profile info: ${error.message}`,
        });
      } else {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        setShowCompleteProfile(false);
      }
    } catch (err) {
      console.error('Unexpected error during profile update:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while saving your profile",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-2xl w-full max-w-md p-0 relative overflow-hidden">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 z-10">
          <X size={28} />
        </button>
        {/* Profile Header */}
        <div className="flex flex-col items-center pt-10 pb-6 px-6 bg-gradient-to-br from-blue-50/80 to-purple-50/80 dark:from-gray-800/80 dark:to-gray-900/80">
          <div className="relative mb-3">
            {profilePic ? (
              <img src={profilePic} alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-blue-500 shadow-lg" />
            ) : (
              <div className="w-28 h-28 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-5xl font-bold shadow-lg">
                <UserIcon size={56} />
              </div>
            )}
            <Button
              size="icon"
              variant="outline"
              className="absolute bottom-2 right-2 bg-white/80 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 shadow hover:bg-blue-100 dark:hover:bg-gray-700"
              onClick={() => setShowCompleteProfile(true)}
            >
              <Edit2 size={18} />
            </Button>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{editName || user.email}</h2>
          <div className="text-sm text-gray-500 dark:text-gray-300 mb-2">{user.email}</div>
        </div>
        {/* Stats Section */}
        <div className="flex justify-center gap-4 px-6 -mt-6 mb-4 flex-wrap">
          {userRating > 0 && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400/80 to-orange-400/80 dark:from-yellow-600/80 dark:to-orange-600/80 rounded-xl px-4 py-2 shadow text-white font-semibold">
              <Star size={20} className="opacity-80 fill-current" />
              <span>{userRating}</span>
              <span className="text-sm opacity-90">({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-gradient-to-r from-green-400/80 to-blue-400/80 dark:from-green-700/80 dark:to-blue-700/80 rounded-xl px-4 py-2 shadow text-white font-semibold">
            <Shield size={20} className="opacity-80" />
            <span>Total Earned</span>
            <span className="ml-2 text-lg">₹{totalEarned.toLocaleString('en-IN')}</span>
          </div>
        </div>
        {/* Info Section */}
        <div className="space-y-3 px-6 pb-6">
          <div className="flex items-center p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 shadow">
            <Mail className="text-blue-500 mr-3" size={22} />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
            </div>
          </div>
          {upiId && (
            <div className="flex items-center p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 shadow">
              <ImageIcon className="text-purple-500 mr-3" size={22} />
              <div>
                <p className="text-xs text-gray-500">UPI ID</p>
                <p className="font-medium text-gray-900 dark:text-white">{upiId}</p>
              </div>
            </div>
          )}
          <div className="flex items-center p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 shadow">
            <GraduationCap className="text-green-500 mr-3" size={22} />
            <div>
              <p className="text-xs text-gray-500">University</p>
              <p className="font-medium text-gray-900 dark:text-white">{university || '(Not set)'}</p>
            </div>
          </div>
          <div className="flex items-center p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 shadow">
            <Info className="text-blue-400 mr-3" size={22} />
            <div>
              <p className="text-xs text-gray-500">Bio</p>
              <p className="font-medium text-gray-900 dark:text-white">{bio || '(Not set)'}</p>
            </div>
          </div>
        </div>
        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col gap-3">
          <Button
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow hover:from-blue-700 hover:to-purple-700 transition"
            onClick={handleSignOut}
          >
            <X size={18} className="mr-2" /> Sign Out
          </Button>
        </div>
        {/* Edit Profile Modal (reuse existing logic) */}
        {showCompleteProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
              <button onClick={() => setShowCompleteProfile(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 z-10">
                <X size={28} />
              </button>
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Edit Profile</h2>
              <div className="space-y-4">
                <div className="flex flex-col items-center">
                  <label htmlFor="profile-pic-upload" className="cursor-pointer">
                    {uploading ? (
                      <span>Uploading...</span>
                    ) : profilePic ? (
                      <img src={profilePic} alt="Profile" className="w-20 h-20 object-cover rounded-full" />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                        <UserIcon size={32} className="text-gray-400" />
                      </div>
                    )}
                  </label>
                  <input
                    id="profile-pic-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePicChange}
                  />
                  <span className="text-xs text-gray-500 mt-2">Click to upload profile picture</span>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">University</label>
                  <input
                    type="text"
                    value={university}
                    onChange={e => setUniversity(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bio</label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="yourname@upi"
                  />
                </div>
                <Button
                  onClick={handleCompleteProfileSave}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
