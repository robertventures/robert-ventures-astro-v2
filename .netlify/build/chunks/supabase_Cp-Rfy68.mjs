import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://kntqkbsgxgeboexdpsxr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtudHFrYnNneGdlYm9leGRwc3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkxOTUyNTEsImV4cCI6MjA1NDc3MTI1MX0.wSG4mMC7JNKCKkthEXls_kKH-b-vOaYERdBU2ZOHsPs"
);

export { supabase as s };
