import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@^2.44.4';

// Declare `process` for the browser environment to satisfy TypeScript.
// The build tool for this platform is expected to polyfill `process.env`.
declare const process: {
  env: {
    [key: string]: string | undefined;
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
  }
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

// Attempt to create a Supabase client only if both URL and anon key are provided
// and appear to be valid. Otherwise, supabase remains null, and the app will
// gracefully fall back to Demo Mode.
if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseUrl.startsWith('https://')) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
