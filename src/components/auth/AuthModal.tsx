
import React, { useState } from 'react';
import { X, Mail, Lock, User, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

const AuthModal = ({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    university: '',
    studentId: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock authentication - in real app, this would call an API
    console.log('Auth attempt:', mode, formData);
    
    // Store user data in localStorage (mock)
    const userData = {
      id: Date.now().toString(),
      name: formData.name || 'User',
      email: formData.email,
      university: formData.university || 'University',
      isVerified: true
    };
    localStorage.setItem('nexlify-user', JSON.stringify(userData));
    
    onClose();
    window.location.reload(); // Simple way to update UI state
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {mode === 'signin' ? 'Welcome Back' : 'Join Nexlify'}
          </h2>
          <p className="text-gray-600">
            {mode === 'signin' 
              ? 'Sign in to your campus marketplace account' 
              : 'Create your campus marketplace account'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="relative">
                <GraduationCap className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="University"
                  value={formData.university}
                  onChange={(e) => handleInputChange('university', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Student ID"
                  value={formData.studentId}
                  onChange={(e) => handleInputChange('studentId', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="email"
              placeholder="University Email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <Button 
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-3"
          >
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-600">
            {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
