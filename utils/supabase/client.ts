import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const createClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase environment variables not set. Using dummy values for static build.');
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
    );
  }
  return createBrowserClient(supabaseUrl, supabaseKey);
};
