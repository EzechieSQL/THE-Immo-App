-- SQL to enable Row Level Security (RLS) and recommended policies for `projects` table.
-- Run in Supabase SQL editor for your project (staging first!).

-- Enable RLS on the table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Allow selects if the project is public OR the requester is the owner
DROP POLICY IF EXISTS "projects_select" ON public.projects;
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT
  USING (is_public = true OR auth.uid() = owner_id);

-- Allow inserts only if auth.uid() is set and owner_id equals auth.uid()
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

-- Allow updates only for the owner; ensure owner_id cannot be changed to another user
DROP POLICY IF EXISTS "projects_update" ON public.projects;
CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (owner_id = auth.uid());

-- Allow deletes only for the owner
DROP POLICY IF EXISTS "projects_delete" ON public.projects;
CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Important: keep the anon/public role limited. Do not grant broad permissions to anon.
