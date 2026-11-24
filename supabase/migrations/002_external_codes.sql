-- Lets a box be opened by ANY QR code / barcode, not just StowList's own labels.
-- Run once in Supabase → SQL Editor (already included in schema.sql for new setups).
--
-- A label for an outside code still gets its own short StowList code (so it can be
-- printed / typed later); external_value holds the exact text the scanner read.

alter table public.labels
  add column if not exists external_value text check (char_length(external_value) between 1 and 500);

-- The same outside code can only point at one of YOUR boxes
create unique index if not exists labels_user_external_value_idx
  on public.labels (user_id, external_value);

notify pgrst, 'reload schema';
