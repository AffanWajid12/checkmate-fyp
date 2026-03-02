import dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";

const { 
    SUPABASE_URL,
    SUPABASE_SERVER_KEY
} = process.env;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVER_KEY);

export default supabase;