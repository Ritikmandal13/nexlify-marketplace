import React, { useState, useEffect } from 'react';
import { User as UserIcon, Mail, GraduationCap, Shield, Edit2, Save, X, Image as ImageIcon, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { User, AuthUser } from '@/types/user';
import { useNavigate } from 'react-router-dom';

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
  const { toast } = useToast();
  const navigate = useNavigate();

  // Always fetch latest user and profile info when modal opens
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          setUser(authUser as AuthUser);
          
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
            {profilePic ? (
              <img src={profilePic} alt="Profile" className="w-20 h-20 object-cover rounded-full" />
            ) : (
              <UserIcon className="text-white" size={32} />
            )}
          </div>
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="text-xl font-bold text-center border-b-2 border-blue-500 focus:outline-none"
            />
          ) : (
            <h2 className="text-2xl font-bold text-gray-900">{editName || 'No Name'}</h2>
          )}
          <div className="flex items-center justify-center mt-2">
            <div className="flex items-center text-green-600">
              <Shield size={16} className="mr-1" />
              <span className="text-sm">Verified Student</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <Mail className="text-gray-400 mr-3" size={20} />
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
          </div>
          {upiId && (
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <ImageIcon className="text-gray-400 mr-3" size={20} />
              <div>
                <p className="text-sm text-gray-600">UPI ID</p>
                <p className="font-medium">{upiId}</p>
              </div>
            </div>
          )}
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <GraduationCap className="text-gray-400 mr-3" size={20} />
            <div className="flex-1">
              <p className="text-sm text-gray-600">University</p>
              <p className="font-medium">{university || '(Not set)'} </p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <Info className="text-gray-400 mr-3" size={20} />
            <div className="flex-1">
              <p className="text-sm text-gray-600">Bio</p>
              <p className="font-medium">{bio || '(Not set)'} </p>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {isEditing ? (
            <div className="flex space-x-3">
              <Button
                onClick={handleSave}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={saving}
              >
                <Save size={16} className="mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                onClick={() => setIsEditing(false)}
                variant="outline"
                className="flex-1"
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="w-full"
            >
              <Edit2 size={16} className="mr-2" />
              Edit Name
            </Button>
          )}

          <Button
            onClick={() => setShowCompleteProfile(true)}
            variant="outline"
            className="w-full"
          >
            <ImageIcon size={16} className="mr-2" />
            Complete Profile
          </Button>

          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
          >
            Sign Out
          </Button>
        </div>

        {/* Complete Profile Modal */}
        {showCompleteProfile && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
              <button
                onClick={() => setShowCompleteProfile(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
              <h2 className="text-xl font-bold mb-4 text-center">Complete Your Profile</h2>
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

        {/* Add View My Listings button at the bottom */}
        <div className="mt-6 flex justify-center">
          <Button
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded shadow hover:from-blue-700 hover:to-purple-700 transition"
            onClick={() => {
              onClose();
              navigate('/my-listings');
            }}
          >
            View My Listings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
