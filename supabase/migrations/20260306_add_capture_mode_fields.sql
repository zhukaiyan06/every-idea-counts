-- Migration: Add capture_mode and deep_answers columns for v2.0
-- Date: 2026-03-06
-- Purpose: Support two capture modes (quick/deep) in Every Idea Counts v2.0

-- Add capture_mode column with default 'quick'
alter table public.ideas
add column if not exists capture_mode text
default 'quick'
check (capture_mode in ('quick', 'deep'));

-- Add deep_answers column for storing answers to the 3 deep mode questions
alter table public.ideas
add column if not exists deep_answers jsonb
default null;

-- Add comments for documentation
comment on column public.ideas.capture_mode is 'Capture mode: quick (default) or deep (with 3 questions)';
comment on column public.ideas.deep_answers is 'JSON object containing answers to the 3 deep mode questions: {q1, q2, q3}';

-- Create index for capture_mode filtering
create index if not exists ideas_owner_capture_mode_idx
on public.ideas (owner_id, capture_mode);

-- Update existing records to have capture_mode = 'quick' (default)
update public.ideas
set capture_mode = 'quick'
where capture_mode is null;