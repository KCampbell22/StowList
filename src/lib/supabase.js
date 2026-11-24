import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
// Publishable key (sb_publishable_...). Older Supabase projects call it the "anon" key.
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error("Missing Supabase settings. Copy .env.example to .env.local and fill it in (see README).");
}
if (key.startsWith("AIza")) {
  throw new Error("That's a Google/Firebase key, not a Supabase one. Use the Supabase publishable key (sb_publishable_...) in .env.local.");
}
if (key.startsWith("sb_secret_")) {
  throw new Error("That's the SECRET key. Use the publishable key (sb_publishable_...) in .env.local.");
}

export const supabase = createClient(url, key);
