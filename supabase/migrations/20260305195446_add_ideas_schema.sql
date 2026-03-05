create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  idea_type text not null
    check (idea_type in ('product', 'creative', 'research')),
  title text not null,
  raw_input text not null,
  status text not null
    check (status in ('draft', 'incubating', 'completed', 'archived')),
  current_state text,
  turn_count_in_state integer not null default 0,
  collected jsonb,
  final_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.idea_messages (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas (id) on delete cascade,
  owner_id uuid not null default auth.uid(),
  mode text
    check (mode in ('incubate', 'ask')),
  role text
    check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.ideas;
create trigger set_updated_at
before update on public.ideas
for each row
execute procedure public.set_updated_at();

alter table public.ideas enable row level security;
alter table public.idea_messages enable row level security;

create policy ideas_select_own
on public.ideas
for select
to authenticated
using (owner_id = auth.uid());

create policy ideas_insert_own
on public.ideas
for insert
to authenticated
with check (owner_id = auth.uid());

create policy ideas_update_own
on public.ideas
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy ideas_delete_own
on public.ideas
for delete
to authenticated
using (owner_id = auth.uid());

create policy idea_messages_select_own
on public.idea_messages
for select
to authenticated
using (owner_id = auth.uid());

create policy idea_messages_insert_own
on public.idea_messages
for insert
to authenticated
with check (owner_id = auth.uid());

create policy idea_messages_update_own
on public.idea_messages
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy idea_messages_delete_own
on public.idea_messages
for delete
to authenticated
using (owner_id = auth.uid());

create index if not exists ideas_owner_updated_at_idx
on public.ideas (owner_id, updated_at);

create index if not exists ideas_owner_status_updated_at_idx
on public.ideas (owner_id, status, updated_at);

create index if not exists idea_messages_idea_id_created_at_idx
on public.idea_messages (idea_id, created_at);
