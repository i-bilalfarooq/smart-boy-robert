-- Create tasks table
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  course_id text, -- optional for now
  task_title text not null,
  description text,
  due_date timestamp with time zone,
  status text not null default 'To Do',
  task_type text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.tasks enable row level security;

create policy "Users can view their own tasks." on public.tasks
  for select using (auth.uid() = user_id);

create policy "Users can insert their own tasks." on public.tasks
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own tasks." on public.tasks
  for update using (auth.uid() = user_id);

create policy "Users can delete their own tasks." on public.tasks
  for delete using (auth.uid() = user_id);
