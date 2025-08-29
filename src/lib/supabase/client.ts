import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  // Use fallback values for development when Supabase isn't configured
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRldmVsb3BtZW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDc4NzAyNzUsImV4cCI6MTk2MzQ0NjI3NX0.fake_key_for_development";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
