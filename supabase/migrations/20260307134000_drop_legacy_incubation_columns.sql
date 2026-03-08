alter table public.ideas
  drop column if exists current_state,
  drop column if exists turn_count_in_state,
  drop column if exists collected;
