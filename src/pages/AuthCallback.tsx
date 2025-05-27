import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the session after email verification
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session?.user) {
          // Create user profile in the users table
          const { error: profileError } = await supabase
            .from('users')
            .upsert({
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata.full_name,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, { 
              onConflict: 'id'
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
          }

          toast({
            title: "Email Verified!",
            description: "Your email has been verified successfully.",
          });
        }

        // Redirect to home page
        navigate('/');
      } catch (error: any) {
        console.error('Error during email verification:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to verify email. Please try again.",
        });
        navigate('/signin');
      }
    };

    handleEmailConfirmation();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900">Verifying your email...</h2>
        <p className="text-gray-600 mt-2">Please wait while we complete the verification process.</p>
      </div>
    </div>
  );
};

export default AuthCallback; 