import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kptdgruwsblwhokwiawf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwdGRncnV3c2Jsd2hva3dpYXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1OTUyNTksImV4cCI6MjA5NzE3MTI1OX0.YSgn0wyh8s2vikTvvrM2Qt49_2ygPaMfkqkbniX7evo'

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
)
