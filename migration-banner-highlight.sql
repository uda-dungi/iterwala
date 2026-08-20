-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: banner highlight line.
--
-- Run in the Supabase SQL Editor. Safe to run more than once.
--
-- WHY: the homepage hero renders each desktop banner as a headline plus a second
-- line in italic gold — "The Pack of 4" / "Buy 1 Get 1 Free". The banners table had
-- no column for that second line, so moving the hardcoded banners into the database
-- would have silently dropped the gold line from every slide.
--
-- Mobile artwork has its copy baked into the image, so this is desktop-only.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.banners add column if not exists highlight text;
