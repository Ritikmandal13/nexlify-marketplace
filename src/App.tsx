import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { AuthUser } from '@/types/user';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import Index from '@/pages/Index';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';
import Marketplace from '@/pages/Marketplace';
import CreateListing from '@/pages/CreateListing';
import ListingDetail from '@/pages/ListingDetail';
import ChatDetail from '@/pages/ChatDetail';
import EditListing from '@/pages/EditListing';
import UserProfile from '@/components/auth/UserProfile';
import ProtectedRoute from '@/components/ProtectedRoute';
import ForgotPassword from "./pages/ForgotPassword";
import AuthCallback from "./pages/AuthCallback";
import Chat from './pages/Chat';
import MyListings from "./pages/MyListings";
import NotFound from "./pages/NotFound";
import Favorites from '@/pages/Favorites';
import { ThemeProvider } from '@/context/ThemeContext';
import { messaging, getToken, onMessage } from './firebase';
import MeetupScheduler from './pages/MeetupScheduler';
import ScheduleMeetup from './pages/ScheduleMeetup';
import ChatBot from '@/components/ChatBot';
import WelcomePage from '@/components/WelcomePage';

const queryClient = new QueryClient();

// Declare the BeforeInstallPromptEvent interface
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const VAPID_KEY = "BLPQAlH2qkGvcoK0P2EUTiYPyXMZ5BxE-Df3Up172nnUpZ0r7YWROFOfK2lr8GvDEbI8kgIepyqTFleckPay5zA";

function App() {
  const { toast } = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);
  const location = useLocation();

  // Memoize isStandalone function
  const isStandalone = useCallback(() => {
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone === true;
  }, []);

  // Memoize handleBeforeInstallPrompt
  const handleBeforeInstallPrompt = useCallback((e: Event) => {
    e.preventDefault();
    setDeferredPrompt(e as BeforeInstallPromptEvent);
    setShowPwaPrompt(true);
    console.log('beforeinstallprompt event fired and deferredPrompt set');
  }, []);

  // Memoize handleAppInstalled
  const handleAppInstalled = useCallback(() => {
    setShowPwaPrompt(false);
    setDeferredPrompt(null);
    console.log('App was installed');
  }, []);

  // Memoize handleInstallClick
  const handleInstallClick = useCallback(async () => {
    console.log('Install button clicked');
    if (!deferredPrompt) {
      console.log('No deferredPrompt available');
      return;
    }
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      console.log('User choice:', choiceResult);
      setDeferredPrompt(null);
      setShowPwaPrompt(false);
    } catch (error) {
      console.error('Error showing install prompt:', error);
      setDeferredPrompt(null);
      setShowPwaPrompt(false);
    }
  }, [deferredPrompt]);

  // Memoize handleClosePrompt
  const handleClosePrompt = useCallback(() => {
    setShowPwaPrompt(false);
    setDeferredPrompt(null);
  }, []);

  useEffect(() => {
    if (!isStandalone()) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }
  }, [isStandalone, handleBeforeInstallPrompt]);

  useEffect(() => {
    if (isStandalone()) {
      setShowPwaPrompt(false);
      setDeferredPrompt(null);
    }
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, [isStandalone, handleAppInstalled]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user as AuthUser | null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {location.pathname !== '/signin' && location.pathname !== '/signup' && <ChatBot />}
          {/* PWA Install Banner */}
          {showPwaPrompt && deferredPrompt && (
            <div className="fixed top-6 left-0 right-0 z-[9999] flex justify-center animate-slideDown">
              <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl px-8 py-5 flex items-center gap-5 border border-gray-200 max-w-md w-full relative">
                {/* App Icon */}
                <img
                  src="/icon-192x192.png"
                  alt="Nexlify"
                  className="w-12 h-12 rounded-xl shadow-md border border-gray-100"
                />
                <div>
                  <div className="font-bold text-lg text-gray-900">Install Nexlify</div>
                  <div className="text-gray-600 text-sm">Get the best experience by installing our app!</div>
                </div>
                <button
                  onClick={handleInstallClick}
                  className="ml-auto px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold shadow hover:from-blue-700 hover:to-purple-700 transition"
                >
                  Install
                </button>
                <button
                  onClick={handleClosePrompt}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1 transition"
                  aria-label="Close"
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              {/* Animation keyframes */}
              <style>
                {`
                  .animate-slideDown {
                    animation: slideDown 0.4s cubic-bezier(0.4,0,0.2,1);
                  }
                  @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-30px);}
                    to { opacity: 1; transform: translateY(0);}
                  }
                `}
              </style>
            </div>
          )}
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/listing/:id" element={<ListingDetail />} />
              <Route 
                path="/create-listing" 
                element={
                  <ProtectedRoute>
                    <CreateListing />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/edit-listing/:id" 
                element={
                  <ProtectedRoute>
                    <EditListing />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/chats" 
                element={<Navigate to="/chat" replace />} 
              />
              <Route 
                path="/chat/:id" 
                element={
                  <ProtectedRoute>
                    <ChatDetail />
                  </ProtectedRoute>
                } 
              />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/my-listings" element={<MyListings />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/meetups" element={<MeetupScheduler />} />
              <Route path="/meetups/schedule" element={<ScheduleMeetup />} />
              <Route path="/welcome" element={<WelcomePage onGetStarted={() => navigate('/')} />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
