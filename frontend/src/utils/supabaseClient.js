import { createClient } from "@supabase/supabase-js";

const { VITE_SUPABASE_URL: supabaseUrl, VITE_SUPABASE_PUBLISHABLE_KEY: supabaseKey } = import.meta.env;

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;