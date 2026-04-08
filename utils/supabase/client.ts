import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase environment variables not set. Using dummy values for static build.');
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
    );
  }
  return createBrowserClient(supabaseUrl, supabaseKey);
};
