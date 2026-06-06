# Supabase setup

1. Create a new Supabase project at https://supabase.com
2. Open SQL Editor → New query
3. Paste the entire contents of `schema.sql` → Run
4. Storage → New bucket → name: `prescriptions`, **private**
5. Run `schema.sql` again so the storage policies attach (the DO block at the bottom is idempotent)
6. Authentication → Providers → Email enabled
7. Authentication → URL config:
   - Site URL: `http://localhost:3000` (dev) / your Vercel URL (prod)
   - Redirect URLs: `http://localhost:3000/auth/callback`
8. Database → Replication → enable Realtime for `appointments` and `follow_ups`
9. Generate types:
   ```
   npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> > types/database.ts
   ```
10. Copy URL + anon key + service role key into `.env.local`

## Bootstrapping the first super_admin

After applying the schema, create one super admin manually:

1. Authentication → Add user → email + password, mark email confirmed
2. SQL Editor:
   ```sql
   INSERT INTO public.users (id, role, full_name, email)
   VALUES ('<auth-user-id>', 'super_admin', 'Your Name', 'you@example.com');
   ```
3. Log in at `/login` — you'll land on `/super-admin/clinics`.
