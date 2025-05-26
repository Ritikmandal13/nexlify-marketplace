
import React, { useState, useEffect } from 'react';
import { User, Mail, GraduationCap, Shield, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserData {
  id: string;
  name: string;
  email: string;
  university: string;
  isVerified: boolean;
}

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfile = ({ isOpen, onClose }: UserProfileProps) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    university: ''
  });

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('nexlify-user');
      if (stored) {
        const user = JSON.parse(stored);
        setUserData(user);
        setEditData({
          name: user.name,
          university: user.university
        });
      }
    }
  }, [isOpen]);

  if (!isOpen || !userData) return null;

  const handleSave = () => {
    const updatedUser = {
      ...userData,
      name: editData.name,
      university: editData.university
    };
    localStorage.setItem('nexlify-user', JSON.stringify(updatedUser));
    setUserData(updatedUser);
    setIsEditing(false);
  };

  const handleSignOut = () => {
    localStorage.removeItem('nexlify-user');
    onClose();
    window.location.reload();
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
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="text-white" size={32} />
          </div>
          
          {isEditing ? (
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
              className="text-xl font-bold text-center border-b-2 border-blue-500 focus:outline-none"
            />
          ) : (
            <h2 className="text-2xl font-bold text-gray-900">{userData.name}</h2>
          )}
          
          <div className="flex items-center justify-center mt-2">
            {userData.isVerified && (
              <div className="flex items-center text-green-600">
                <Shield size={16} className="mr-1" />
                <span className="text-sm">Verified Student</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <Mail className="text-gray-400 mr-3" size={20} />
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{userData.email}</p>
            </div>
          </div>

          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <GraduationCap className="text-gray-400 mr-3" size={20} />
            <div className="flex-1">
              <p className="text-sm text-gray-600">University</p>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.university}
                  onChange={(e) => setEditData(prev => ({ ...prev, university: e.target.value }))}
                  className="font-medium border-b border-gray-300 focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p className="font-medium">{userData.university}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {isEditing ? (
            <div className="flex space-x-3">
              <Button
                onClick={handleSave}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Save size={16} className="mr-2" />
                Save
              </Button>
              <Button
                onClick={() => setIsEditing(false)}
                variant="outline"
                className="flex-1"
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
              Edit Profile
            </Button>
          )}

          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
