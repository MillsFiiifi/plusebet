import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client using the SERVICE ROLE key.
 *
 * Bypasses Row Level Security — never import this in client code or your
 * service role key will end up in the browser bundle. For pages /
 * components, use createBrowserSupabase() (anon key) if you ever need it.
 *
 * The client is lazily memoized so we don't create a new one per import.
 */
let _server: SupabaseClient | null = null

export function supabaseServer(): SupabaseClient {
  if (_server) return _server

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Supabase env vars missing: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
    )
  }

  _server = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
  return _server
}

/**
 * Whether a write failed because the database is missing a column the code
 * knows about — i.e. a migration hasn't been run yet.
 *
 * Two codes, because the same missing column is reported differently depending
 * on who notices first: PostgREST rejects an INSERT or UPDATE against its own
 * schema cache with PGRST204, while a SELECT reaches Postgres and comes back
 * with 42703. A write path that only checks one of them will sail straight into
 * the error it meant to handle.
 */
export function isMissingColumnError(error: { code?: string | null } | null): boolean {
  return error?.code === 'PGRST204' || error?.code === '42703'
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  )
}
