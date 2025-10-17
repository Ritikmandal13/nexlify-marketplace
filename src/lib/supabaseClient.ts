import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://spjvuhlgitqnthcvnpyb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwanZ1aGxnaXRxbnRoY3ZucHliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNzUwMTksImV4cCI6MjA2Mzg1MTAxOX0.YhMtwtpMP7WcydZaEfid_SV_-ugL-I8nRenik9LFOKc';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 

async function handleProfilePicChange(event) {
    const file = event.target.files[0];
    if (!file) {
        console.error("No file selected");
        return;
    }

    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
        console.error("User not authenticated");
        return;
    }

    // Use user.id in the path for uniqueness
    const filePath = `${session.user.id}/${file.name}`;

    const { data, error } = await supabase
        .storage
        .from('avatars')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false // set to true if you want to overwrite
        });

    if (error) {
        console.error("Error uploading file:", error.message);
    } else {
        console.log("File uploaded successfully:", data);
        // You can now use data.path to get the public URL if needed
    }
} 