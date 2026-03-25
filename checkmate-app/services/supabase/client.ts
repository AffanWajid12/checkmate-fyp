import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Expo Extras are configured in app.json (not hardcoded in source).
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string | undefined;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase environment is missing. Set extra.supabaseUrl and extra.supabaseAnonKey in checkmate-app/app.json.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
