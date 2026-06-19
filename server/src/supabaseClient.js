import { createClient } from '@supabase/supabase-js'

let supabaseClient = null

export const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase 环境变量未配置，请检查 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return supabaseClient
}

export const getStorageBucket = () => {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET

  if (!bucket) {
    throw new Error('Supabase Storage bucket 未配置，请检查 SUPABASE_STORAGE_BUCKET')
  }

  return bucket
}
