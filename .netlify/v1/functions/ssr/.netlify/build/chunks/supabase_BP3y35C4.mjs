import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://besslmdkzaujujeungzb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlc3NsbWRremF1anVqZXVuZ3piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM0OTgyMTMsImV4cCI6MjA0OTA3NDIxM30.7-cVkOKtsjnIFbmrS_vNdgPPFoZ83ayXNkDRLlY-BwY"
);

export { supabase as s };
