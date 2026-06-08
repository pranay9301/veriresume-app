-- subscriptions table for Razorpay subscription sync
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  razorpay_customer_id text,
  razorpay_subscription_id text unique,
  plan text not null check (plan in ('free','pro','team')),
  status text not null default ('active') check (status in ('active','past_due','canceled','incomplete','trialing')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_subscriptions_user on public.subscriptions(user_id);
create index if not exists idx_subscriptions_razorpay_sub on public.subscriptions(razorpay_subscription_id);

alter table public.subscriptions enable row level security;

create policy "Users can view own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);

create policy "Users can upsert own subscription" on public.subscriptions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own subscription" on public.subscriptions
  for update using (auth.uid() = user_id);

-- credits table
create table if not exists public.credits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  amount integer not null default 0,
  period_start timestamptz default now(),
  period_end timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_credits_user on public.credits(user_id);

alter table public.credits enable row level security;

create policy "Users can view own credits" on public.credits
  for select using (auth.uid() = user_id);

create policy "Users can insert own credits" on public.credits
  for insert with check (auth.uid() = user_id);

-- resumes vault
create table if not exists public.resumes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  full_name text,
  user_email text,
  extracted_data jsonb,
  original_filename text,
  created_at timestamptz default now()
);

create index if not exists idx_resumes_user on public.resumes(user_id);

alter table public.resumes enable row level security;

create policy "Users can view own resumes" on public.resumes
  for select using (auth.uid() = user_id);

create policy "Users can insert own resumes" on public.resumes
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own resumes" on public.resumes
  for delete using (auth.uid() = user_id);
