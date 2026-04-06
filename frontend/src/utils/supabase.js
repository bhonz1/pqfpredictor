import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
