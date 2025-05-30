import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import Chats from '@/pages/Chats';
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

const queryClient = new QueryClient();

// Declare the BeforeInstallPromptEvent interface
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function App() {
  const { toast } = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Check if the app is running in standalone mode (PWA)
  const isStandalone = () => {
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone === true;
  };

  useEffect(() => {
    // Only handle PWA installation prompt if not running in standalone mode
    if (!isStandalone()) {
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        
        // Show a custom install prompt
        toast({
          title: "Install Nexlify",
          description: "Install our app for a better experience!",
          action: (
            <button
              onClick={handleInstallClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Install
            </button>
          ),
        });
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, [toast]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        // console.log('User accepted the install prompt');
      } else {
        // console.log('User dismissed the install prompt');
      }
      setDeferredPrompt(null);
    }
  };

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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
