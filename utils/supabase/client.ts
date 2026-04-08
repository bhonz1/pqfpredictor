import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  // During static build, env vars may not be available - use placeholders
  // The actual values will be used at runtime in the browser
  const url = supabaseUrl || 'https://placeholder.supabase.co';
  const key = supabaseKey || 'placeholder-key';

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase environment variables not set. Using placeholder values for build. Runtime will use actual values from browser env.');
  }

  return createBrowserClient(url, key);
};
