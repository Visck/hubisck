import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mgvpyjlpouvgmaodbdjk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ndnB5amxwb3V2Z21hb2RiZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMjU3MjUsImV4cCI6MjA3OTkwMTcyNX0.lgIK10Y1MohDutrUmhznucjpbBQHxocU5zQit-8h6kc';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
