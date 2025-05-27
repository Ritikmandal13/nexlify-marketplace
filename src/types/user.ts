export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  university?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserMetadata {
  full_name?: string;
  avatar_url?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: UserMetadata;
  app_metadata?: {
    provider?: string;
    [key: string]: any;
  };
  aud?: string;
  created_at?: string;
  role?: string;
  updated_at?: string;
} 