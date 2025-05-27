import React, { useState, useEffect } from 'react';
import { User as UserIcon, Mail, GraduationCap, Shield, Edit2, Save, X, Image as ImageIcon, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { User, AuthUser } from '@/types/user';

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
  const { toast } = useToast();

  // Always fetch latest user and profile info when modal opens
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser(authUser as AuthUser);
        const { data, error } = await supabase
          .from('users')
          .select('id, email, full_name, avatar_url, university, bio, created_at, updated_at')
          .eq('id', authUser.id)
          .single();
        
        if (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch user data",
          });
          return;
        }

        if (data) {
          setUserData(data);
          setEditName(data.full_name || '');
          setProfilePic(data.avatar_url || '');
          setUniversity(data.university || '');
          setBio(data.bio || '');
        } else {
          setEditName('');
          setProfilePic('');
          setUniversity('');
          setBio('');
        }
      } else {
        setEditName('');
        setProfilePic('');
        setUniversity('');
        setBio('');
      }
    };
    if (isOpen) fetchUser();
  }, [isOpen, toast]);

  if (!isOpen || !user) return null;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const updates = {
      id: user.id,
      email: user.email,
      full_name: editName,
    };
    const { error } = await supabase.from('users').upsert(updates, { onConflict: 'id' });
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
    const file = e.target.files[0];
    const filePath = `${user.id}/${file.name}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (uploadError) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload image: " + uploadError.message,
      });
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    setProfilePic(data.publicUrl);
    // Save avatar_url to profile
    const { error: updateError } = await supabase.from('users').upsert({ id: user.id, avatar_url: data.publicUrl }, { onConflict: 'id' });
    if (updateError) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile picture",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
    }
    setUploading(false);
  };

  const handleCompleteProfileSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updates = {
        id: user.id,
        email: user.email,
        full_name: editName,
        university,
        bio,
        avatar_url: profilePic,
        updated_at: new Date().toISOString()
      };
      
      console.log('Attempting to update profile with:', updates);
      
      const { error } = await supabase
        .from('users')
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

          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <GraduationCap className="text-gray-400 mr-3" size={20} />
            <div className="flex-1">
              <p className="text-sm text-gray-600">University</p>
              <p className="font-medium">{university || '(Not set)'}</p>
            </div>
          </div>

          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <Info className="text-gray-400 mr-3" size={20} />
            <div className="flex-1">
              <p className="text-sm text-gray-600">Bio</p>
              <p className="font-medium">{bio || '(Not set)'}</p>
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
