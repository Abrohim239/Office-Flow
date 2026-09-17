# OfficeFlow Pro
Next.js + Supabase + Vercel starter for office task and delivery management.

Features: email/password login, dashboard, task creation, employee assignment, free-text custom status, quantity, responsive UI.

## Setup
1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Run `npm install` then `npm run dev`.

## Vercel
Add the same two environment variables in Vercel Project Settings > Environment Variables.

## First login user
Create a user in Supabase Authentication > Users. Then create the matching profile:
insert into public.profiles (id,full_name,role) values ('AUTH_USER_UUID','Your Name','manager');

Never put the Supabase secret/service-role key in frontend code.